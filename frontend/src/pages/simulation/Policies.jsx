import { useContext, useState, useEffect, useMemo } from "react";
import { Box, Grid, Typography, Alert } from "@mui/material";
import _ from "lodash";
import PolicyAccordion from "../../components/simSetup/PolicyAccordion";
import { SimulationContext } from "./BaseSimView";
import ChangeableParameters from "../../components/simView/ChangeableParameters";
import { receivePoliciesPayload } from "../../api/payloadReceiver";

/**
 * Policies view for a running simulation.
 *
 * - Uses SimulationContext to talk to the backend over WebSocket.
 * - Requests the current policies once on mount.
 * - Listens for "get_policies" messages and maps backend payloads into
 *   the frontend `policyParams` shape via `receivePoliciesPayload`.
 * - Renders `PolicyAccordion` in "runtime" mode (`starting = false`).
 * - Sends debounced policy updates back to the backend so that each
 *   keystroke does not immediately produce a WebSocket message.
 */
export default function Policies() {
  const simAPI = useContext(SimulationContext);
  const [error, setError] = useState(null);
  const [policies, setPolicies] = useState(null);

  /**
   * On mount:
   * 1. Ensure `simAPI` exists (if not, show a user-visible error).
   * 2. Ask the backend for the current policies via `getPolicies()`.
   * 3. Register a WebSocket listener for "get_policies" responses and
   *    convert them to the frontend shape.
   */
  useEffect(() => {
    const fetchPolicies = async () => {
      if (!simAPI) {
        // This typically only happens on a hard reload or if the context failed to initialize.
        setError("Simulation API not available");
        return;
      }
      try {
        // Triggers a WebSocket request; the actual data will arrive
        // through the message listener below (handleWebSocketMessage).
        simAPI.getPolicies();
      } catch (err) {
        setError(err.message);
      }
    };

    fetchPolicies(); // Initial fetch when the component mounts

    const handleWebSocketMessage = (message) => {
      if (message.action === "get_policies") {
        // Map the backend payload into the frontend `policyParams` shape.
        setPolicies(receivePoliciesPayload(message.data));
      }
    };

    if (simAPI) {
      simAPI.addMessageListener(handleWebSocketMessage);

      // Cleanup: remove the listener when the component unmounts
      // or when simAPI changes.
      return () => simAPI.removeMessageListener(handleWebSocketMessage);
    }
  }, [simAPI]);

  /**
   * Debounced function that sends policy updates to the backend.
   *
   * - Called whenever the user edits policies in the UI.
   * - Debouncing prevents sending a WebSocket message on every keystroke.
   * - The debounce is tied to the current `simAPI` instance.
   */
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

  /**
   * Cleanup for the debounced function:
   * - When the component unmounts, flush any pending debounced call.
   * - This ensures the last user change is not lost if they navigate away
   *   before the debounce delay completes.
   */
  useEffect(() => {
    return () => {
      debouncedSetPolicies.flush();
    };
  }, [debouncedSetPolicies]);

  /**
   * Handler for scalar policy fields (e.g., salesTax, corporateTax, etc.).
   * - Updates local `policies` state.
   * - Triggers a debounced push to the backend.
   *
   * @param {string} field - Top-level field name in `policies`.
   */
  const handlePolicyChange = (field) => (event) => {
    const { value } = event.target;
    setPolicies((prevPolicies) => {
      if (!prevPolicies) return prevPolicies;

      const newPolicies = _.cloneDeep(prevPolicies);
      _.set(newPolicies, field, parseFloat(value) || 0);

      debouncedSetPolicies(newPolicies); // Call the debounced function
      return newPolicies;
    });
  };

  /**
   * Handler for per-industry overrides, including numeric fields
   * (salesTaxByIndustry, priceCapByIndustry, etc.) and boolean fields
   * (priceCapEnabledByIndustry).
   *
   * @param {string} fieldName  - Name of the object field on `policies`,
   *                              e.g. "salesTaxByIndustry".
   * @param {string} industryKey - Industry enum value, e.g. "GROCERIES".
   */
  const handleIndustryPolicyChange = (fieldName, industryKey) => (event) => {
    const raw =
      event && event.target
        ? event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value
        : event;

    // Convert to appropriate JS type:
    //  - checkboxes => boolean
    //  - sliders / text => number
    const value =
      typeof raw === "boolean"
        ? raw
        : raw === "" || raw === null || raw === undefined
        ? 0
        : parseFloat(raw) || 0;

    setPolicies((prevPolicies) => {
      if (!prevPolicies) return prevPolicies;

      const newPolicies = _.cloneDeep(prevPolicies);
      const currentMap = newPolicies[fieldName] || {};
      newPolicies[fieldName] = {
        ...currentMap,
        [industryKey]: value,
      };

      debouncedSetPolicies(newPolicies);
      return newPolicies;
    });
  };

  /**
   * Handler for toggling the global price cap enabled/disabled state.
   */
  const handlePriceCapToggle = () => {
    setPolicies((prevPolicies) => {
      if (!prevPolicies) return prevPolicies;

      const newPolicies = {
        ...prevPolicies,
        priceCapEnabled: !prevPolicies.priceCapEnabled,
      };

      debouncedSetPolicies(newPolicies);
      return newPolicies;
    });
  };

  /**
   * Handler for editing a single personal income tax bracket
   * (global PIT, not demographic-specific) while the simulation is running.
   *
   * @param {number} index - Index of the bracket in the PIT array.
   * @param {string} field - "threshold" or "rate".
   */
  const handlePersonalIncomeTaxChange = (index, field) => (event) => {
    const { value } = event.target;
    setPolicies((prevPolicies) => {
      if (!prevPolicies) return prevPolicies;

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

  /**
   * Adds a new global personal income tax bracket at the end of the list.
   */
  const addPersonalIncomeTaxBracket = () => {
    setPolicies((prevPolicies) => {
      if (!prevPolicies) return prevPolicies;

      const newPolicies = _.cloneDeep(prevPolicies);
      const newTaxBrackets = [...(newPolicies.personalIncomeTax || [])];

      newTaxBrackets.push({ threshold: 0, rate: 0 });
      newPolicies.personalIncomeTax = newTaxBrackets;

      debouncedSetPolicies(newPolicies);
      return newPolicies;
    });
  };

  /**
   * Removes a global personal income tax bracket by index.
   *
   * @param {number} index - Index of the bracket to remove.
   */
  const removePersonalIncomeTaxBracket = (index) => {
    setPolicies((prevPolicies) => {
      if (!prevPolicies) return prevPolicies;

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
        {/* LEFT column: main editable content */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
            Policies
          </Typography>

          {/* Only render the accordion when policies data has been loaded */}
          {policies ? (
            <PolicyAccordion
              policyParams={policies}
              handlePolicyChange={handlePolicyChange}
              handleIndustryPolicyChange={handleIndustryPolicyChange}
              starting={false}
              handlePriceCapToggle={handlePriceCapToggle}
              handlePersonalIncomeTaxChange={handlePersonalIncomeTaxChange}
              addPersonalIncomeTaxBracket={addPersonalIncomeTaxBracket}
              removePersonalIncomeTaxBracket={removePersonalIncomeTaxBracket}
            />
          ) : null}
        </Grid>

        {/* RIGHT column: other changeable parameters (if any) */}
        <ChangeableParameters />
      </Grid>
    </Box>
  );
}
