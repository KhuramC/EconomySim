import { useContext, useState, useEffect } from "react";
import { Box, Grid, Typography, Paper, Alert } from "@mui/material";
import _ from "lodash";
import PolicyAccordion from "../../components/SimSetup/PolicyAccordion.jsx";
import { SimulationContext } from "./BaseSimView.jsx";
import ChangeableParameters from "../../components/SimSetup/ChangeableParameters.jsx";

export default function Policies() {
  const simAPI = useContext(SimulationContext);
  const [error, setError] = useState(null);
  const [policies, setPolicies] = useState(null);

  useEffect(() => {
    const fetchPolicies = async () => {
      if (!simAPI) {
        // ideally, this never happens unless a reload occurs
        setError("Simulation API not available");
        return;
      }
      try {
        const fetchedPolicies = await simAPI.getModelPolicies();
        console.log("fetched policies:", fetchedPolicies);
        setPolicies(fetchedPolicies); // Assuming fetchedPolicies is already in frontend format
      } catch (err) {
        setError(err.message);
      }
    };

    fetchPolicies(); // Initial fetch

    const handleWebSocketMessage = (message) => {
      // Refetch policies if they were changed by another client or if a step occurs
      if (message.action === "set_policies" || message.action === "step") {
        console.log("Policies updated via WebSocket, refetching...");
        fetchPolicies();
      }
    };

    if (simAPI) {
      simAPI.addMessageListener(handleWebSocketMessage);
      return () => simAPI.removeMessageListener(handleWebSocketMessage);
    }
  }, [simAPI]); // Re-run effect if simAPI changes

  const handlePolicyChange = (field) => (event) => {
    const { value } = event.target;
    setPolicies((prevPolicies) => {
      // Use lodash for deep cloning and setting nested properties
      const newPolicies = _.cloneDeep(prevPolicies);
      _.set(newPolicies, field, parseFloat(value) || 0);

      // Send update to backend via WebSocket
      if (simAPI) {
        simAPI.setPolicies(newPolicies);
      }

      return newPolicies;
    });
  };

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
        {/* LEFT column: main content (editable) */}
        <Grid item xs={12} md={8}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
            Policies
          </Typography>

          {/* Only render the accordion when policies data is available */}
          {policies ? (
            <PolicyAccordion
              policyParams={policies}
              handlePolicyChange={handlePolicyChange}
              starting={false}
            />
          ) : null}
        </Grid>

        <ChangeableParameters />
      </Grid>
    </Box>
  );
}
