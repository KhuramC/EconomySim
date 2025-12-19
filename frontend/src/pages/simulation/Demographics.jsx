import { useContext, useState, useEffect } from "react";
import { Box, Grid, Typography, Alert } from "@mui/material";
import { SimulationContext } from "./BaseSimView";
import DemographicAccordion from "../../components/simSetup/DemographicAccordion";
import UnchangeableParameters from "../../components/simView/UnchangeableParameters";
import { receivePopulationPayload } from "../../api/payloadReceiver";

/**
 * Read-onlyDemographics view
 */
export default function Demographics({ oldDemoParams }) {
  const simAPI = useContext(SimulationContext);
  const [error, setError] = useState(null);
  const [week, setWeek] = useState(0);
  const [demoParams, setDemoParams] = useState(
    week === 0 ? oldDemoParams : null
  );

  useEffect(() => {
    const fetchDemographics = async () => {
      if (!simAPI) {
        // ideally, this never happens unless a reload occurs
        setError("Simulation API not available");
        return;
      }
      simAPI.getCurrentDemoMetrics();
    };

    // Only fetch if it's not week 0
    if (week > 0 && !demoParams) {
      fetchDemographics();
    }

    const handleWebSocketMessage = (message) => {
      // only update week if it's a get_current_week action
      if (message.action === "get_current_week" && message.data) {
        setWeek(message.data.week);
        // If we just moved off week 0, fetch for the first time
        if (week === 0 && message.data.week > 0) {
          fetchDemographics();
        }
      }

      // get new industries if a step occurs
      if (message.action === "step" || message.action === "reverse_step") {
        console.log(
          "Simulation timestep moved via WebSocket, refetching demographic metrics"
        );
        fetchDemographics();
      }

      if (message.action === "get_current_demo_metrics" && message.data) {
        const newDemoParams = receivePopulationPayload(message.data, false);
        console.log("changed fetched demographic metrics:", newDemoParams);
        setDemoParams(newDemoParams);
      }
    };

    if (simAPI) {
      simAPI.getCurrentWeek(); // Get initial week
      simAPI.addMessageListener(handleWebSocketMessage);
      return () => simAPI.removeMessageListener(handleWebSocketMessage);
    }
  }, [simAPI, week, demoParams, oldDemoParams]); // Re-run effect if dependencies change

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
        <Grid size={{ xs: 12 }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
            Demographics
          </Typography>

          {/* Only render the accordion when demogrpahics data is available */}
          {demoParams ? (
            <DemographicAccordion
              demoParams={demoParams}
              // don't want to support editing, so pass a no-op HOF to avoid errors:
              // IndustryAccordion expects a higher-order handler: (k, f) => (e) => {}
              handleDemographicChange={() => () => {}}
              readOnly={true}
            />
          ) : null}
        </Grid>
        <UnchangeableParameters />
      </Grid>
    </Box>
  );
}
