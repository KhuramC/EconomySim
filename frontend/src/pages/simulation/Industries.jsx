import { useContext, useState, useEffect } from "react";
import { Box, Grid, Typography, Alert } from "@mui/material";
import { SimulationContext } from "./BaseSimView.jsx";
import IndustryAccordion from "../../components/SimSetup/IndustryAccordion.jsx";
import UnchangeableParameters from "../../components/SimView/UnchangeableParameters.jsx";
import { receiveIndustriesPayload } from "../../api/payloadReceiver.js";

/**
 * Read-only Industries view
 */
export default function Industries({ oldindustryParams }) {
  const simAPI = useContext(SimulationContext);
  const [error, setError] = useState(null);
  const [week, setWeek] = useState(0);
  const [industryParams, setIndustryParams] = useState(
    week === 0 ? oldindustryParams : null
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

    // Only fetch if it's not week 0
    if (week > 0 && !industryParams) {
      fetchIndustries();
    }

    const handleWebSocketMessage = (message) => {
      // only update week if it's a get_current_week action
      if (message.action === "get_current_week" && message.data) {
        setWeek(message.data.week);
        // If we just moved off week 0, fetch for the first time
        if (week === 0 && message.data.week > 0) {
          fetchIndustries();
        }
      }

      // get new industries if a step occurs
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
      simAPI.sendMessage({ action: "get_current_week" }); // Get initial week
      simAPI.addMessageListener(handleWebSocketMessage);
      return () => simAPI.removeMessageListener(handleWebSocketMessage);
    }
  }, [simAPI, week, industryParams, oldindustryParams]); // Re-run effect if dependencies change

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
        <Grid size={{ xs: 12 }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
            Industries
          </Typography>

          {/* Only render the accordion when industries data is available */}
          {industryParams ? (
            <IndustryAccordion
              industryParams={industryParams}
              // If you don’t support editing here, pass a no-op HOF to avoid errors:
              // IndustryAccordion expects a higher-order handler: (k, f) => (e) => {}
              handleIndustryChange={() => () => {}}
              starting={false}
            />
          ) : null}
        </Grid>

        <UnchangeableParameters />
      </Grid>
    </Box>
  );
}
