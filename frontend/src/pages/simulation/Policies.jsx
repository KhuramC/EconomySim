import { useContext, useState, useEffect, useMemo } from "react";
import { Box, Grid, Typography, Alert } from "@mui/material";
import _ from "lodash";
import PolicyAccordion from "../../components/SimSetup/PolicyAccordion.jsx";
import { SimulationContext } from "./BaseSimView.jsx";
import ChangeableParameters from "../../components/SimView/ChangeableParameters.jsx";

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
      // Refetch policies if a step occurs
      if (message.action === "step" || message.action === "reverse_step") {
        console.log("Policies updated via WebSocket, refetching...");
        fetchPolicies();
      }
    };

    if (simAPI) {
      simAPI.addMessageListener(handleWebSocketMessage);
      return () => simAPI.removeMessageListener(handleWebSocketMessage);
    }
  }, [simAPI]); // Re-run effect if simAPI changes

  // Debounce the function that sends policy updates via WebSocket.
  // This prevents sending a message on every keystroke.
  const debouncedSetPolicies = useMemo(
    () =>
      _.debounce((newPolicies) => {
        if (simAPI) {
          console.log("Debounced: Sending policies update", newPolicies);
          simAPI.setPolicies(newPolicies);
        }
      }, 500), // 500ms delay
    [simAPI]
  );

  // Cleanup the debounced function on component unmount
  useEffect(() => {
    return () => {
      // Flush any pending updates when the component unmounts.
      // This ensures the last change is saved.
      debouncedSetPolicies.flush();
    };
  }, [debouncedSetPolicies]);

  const handlePolicyChange = (field) => (event) => {
    const { value } = event.target;
    setPolicies((prevPolicies) => {
      // Use lodash for deep cloning and setting nested properties
      const newPolicies = _.cloneDeep(prevPolicies);
      _.set(newPolicies, field, parseFloat(value) || 0);

      debouncedSetPolicies(newPolicies); // Call the debounced function
      return newPolicies;
    });
  };

  const handlePriceCapToggle = (event) => {
    setPolicies((prevPolicies) => {
      const newPolicies = {
        ...prevPolicies,
        priceCapEnabled: !prevPolicies.priceCapEnabled,
      };

      debouncedSetPolicies(newPolicies);
      return newPolicies;
    });
  };

  const handlePersonalIncomeTaxChange = (index, field) => (event) => {
    const { value } = event.target;
    setPolicies((prevPolicies) => {
      const newPolicies = _.cloneDeep(prevPolicies);
      const newTaxBrackets = [...(newPolicies.personalIncomeTax || [])];
      newTaxBrackets[index] = {
        ...newTaxBrackets[index],
        [field]: parseFloat(value) || 0,
      };
      newPolicies.personalIncomeTax = newTaxBrackets;
      debouncedSetPolicies(newPolicies);
      return newPolicies;
    });
  };

  const addPersonalIncomeTaxBracket = () => {
    setPolicies((prevPolicies) => {
      const newPolicies = _.cloneDeep(prevPolicies);
      const newTaxBrackets = [...(newPolicies.personalIncomeTax || [])];
      newTaxBrackets.push({ threshold: 0, rate: 0 });
      newPolicies.personalIncomeTax = newTaxBrackets;
      debouncedSetPolicies(newPolicies);
      return newPolicies;
    });
  };

  const removePersonalIncomeTaxBracket = (index) => {
    setPolicies((prevPolicies) => {
      const newPolicies = _.cloneDeep(prevPolicies);
      const newTaxBrackets = (newPolicies.personalIncomeTax || []).filter(
        (_, i) => i !== index
      );
      newPolicies.personalIncomeTax = newTaxBrackets;
      debouncedSetPolicies(newPolicies);
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
        <Grid size={{ xs: 12 }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
            Policies
          </Typography>

          {/* Only render the accordion when policies data is available */}
          {policies ? (
            <PolicyAccordion
              policyParams={policies}
              handlePolicyChange={handlePolicyChange}
              starting={false}
              handlePriceCapToggle={handlePriceCapToggle}
              handlePersonalIncomeTaxChange={handlePersonalIncomeTaxChange}
              addPersonalIncomeTaxBracket={addPersonalIncomeTaxBracket}
              removePersonalIncomeTaxBracket={removePersonalIncomeTaxBracket}
            />
          ) : null}
        </Grid>

        <ChangeableParameters />
      </Grid>
    </Box>
  );
}
