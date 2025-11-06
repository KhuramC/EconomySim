import { useContext, useState, useEffect, useMemo } from "react";
import { Box, Grid, Typography, Alert } from "@mui/material";
import { SimulationContext } from "./BaseSimView.jsx";
import IndustryAccordion from "../../components/SimSetup/IndustryAccordion.jsx";
import { IndustryType } from "../../types/IndustryType.js";
import UnchangeableParameters from "../../components/SimView/UnchangeableParameters.jsx";
import { receiveIndustriesPayload } from "../../api/payloadReceiver.js";

const getDefaultIndustryParams = () => ({
  startingInventory: 1000,
  startingPrice: 10,
  industrySavings: 50000,
  offeredWage: 15,
});
/**
 * Read-only Industries view
 */
export default function Industries() {
  const simAPI = useContext(SimulationContext);
  const [error, setError] = useState(null);
  const [industryParams, setIndustryParams] = useState(
    Object.fromEntries(
      Object.values(IndustryType).map((value) => [
        value,
        getDefaultIndustryParams(),
      ])
    )
  );

  useEffect(() => {
    const fetchIndustries = async () => {
      if (!simAPI) {
        // ideally, this never happens unless a reload occurs
        setError("Simulation API not available");
        return;
      }
      simAPI.sendMessage({ action: "get_current_industry_data" });
    };

    fetchIndustries(); // Initial fetch

    const handleWebSocketMessage = (message) => {
      // Refetch industryParams if they were changed if a step occurs
      if (message.action === "step" || message.action === "reverse_step") {
        console.log(
          "Simulation timestep moved via WebSocket, refetching industry parameters"
        );
        fetchIndustries();
      }
      if (message.action === "get_current_industry_data" && message.data) {
        const newIndustryParams = receiveIndustriesPayload(message.data, false);
        console.log("changed fetched industry parameters:", newIndustryParams);
        setIndustryParams(newIndustryParams);
      }
    };

    if (simAPI) {
      simAPI.addMessageListener(handleWebSocketMessage);
      return () => simAPI.removeMessageListener(handleWebSocketMessage);
    }
  }, [simAPI]); // Re-run effect if simAPI changes

  return (
    <Box>
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError(null)} // Allows user to dismiss the error
        >
          Error: {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* LEFT column: main content */}
        <Grid item xs={12} md={8}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
            Industries
          </Typography>

          {/* Only render the accordion when industries data is available;
          Uses existing accordion; safe because all keys are present */}
          {industryParams ? (
            <IndustryAccordion
              industryParams={industryParams}
              // If you don’t support editing here, pass a no-op HOF to avoid errors:
              // IndustryAccordion expects a higher-order handler: (k, f) => (e) => {}
              handleIndustryChange={() => () => {}}
              starting={false}
              readOnly={true}
            />
          ) : null}
        </Grid>

        <UnchangeableParameters />
      </Grid>
    </Box>
  );
}
