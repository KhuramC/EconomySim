import { useContext, useState, useEffect, useMemo } from "react";
import { Box, Grid, Typography, Alert } from "@mui/material";
import _ from "lodash";
import PolicyAccordion from "../../components/SimSetup/PolicyAccordion.jsx";
import { SimulationContext } from "./BaseSimView.jsx";
import ChangeableParameters from "../../components/SimView/ChangeableParameters.jsx";

/**
 * Policies (SimView)
 * - Fetch current policies from backend (already converted to frontend shape)
 * - Allow editing of globals + advanced overrides
 * - Send updates over WebSocket with debounce
 * - IMPORTANT: also commit onBlur (immediate flush) so manual typing is always applied
 */
export default function Policies() {
  const simAPI = useContext(SimulationContext);
  const [error, setError] = useState(null);
  const [policies, setPolicies] = useState(null);

  // Initial fetch + refetch on selected WS notifications
  useEffect(() => {
    const fetchPolicies = async () => {
      if (!simAPI) {
        setError("Simulation API not available");
        return;
      }
      try {
        const fetched = await simAPI.getModelPolicies(); // already in UI shape
        setPolicies(fetched);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchPolicies();

    const handleWS = (message) => {
      // When someone else edits or the model steps, reload policies
      if (message.action === "set_policies" || message.action === "step") {
        fetchPolicies();
      }
    };

    if (simAPI) {
      simAPI.addMessageListener(handleWS);
      return () => simAPI.removeMessageListener(handleWS);
    }
  }, [simAPI]);

  // Debounced sender shared by all inputs
  const debouncedSetPolicies = useMemo(
    () =>
      _.debounce((next) => {
        if (simAPI) simAPI.setPolicies(next);
      }, 500),
    [simAPI]
  );

  // Flush pending update on unmount
  useEffect(() => () => debouncedSetPolicies.flush(), [debouncedSetPolicies]);

  /**
   * Global field editor
   * - onChange: keep raw string so users can type freely; sender is debounced
   * - onBlur (we pass null from the component): flush immediately
   */
  const handlePolicyChange = (field) => (eOrNull) => {
    // If called with null (our onBlur contract), flush immediately
    if (!eOrNull || !eOrNull.target) {
      debouncedSetPolicies.flush();
      return;
    }

    const { value } = eOrNull.target; // keep raw string
    setPolicies((prev) => {
      const next = _.cloneDeep(prev);
      _.set(next, field, value);
      debouncedSetPolicies(next);
      return next;
    });
  };

  // Helper to set nested override like byIndustry[key][field] = raw
  const setNested = (scope, key, field, raw, prev) => {
    const next = _.cloneDeep(prev);
    if (!next[scope]) next[scope] = {};
    if (!next[scope][key]) next[scope][key] = {};
    next[scope][key][field] = raw; // keep raw string ("" means inherit)
    return next;
  };

  /** Per-industry override editor (same onChange/onBlur contract) */
  const handlePolicyIndustryOverrideChange = (industryKey, field) => (eOrNull) => {
    if (!eOrNull || !eOrNull.target) {
      debouncedSetPolicies.flush();
      return;
    }
    const { value } = eOrNull.target;
    setPolicies((prev) => {
      const next = setNested("byIndustry", industryKey, field, value, prev);
      debouncedSetPolicies(next);
      return next;
    });
  };

  /** Per-demographic override editor (same onChange/onBlur contract) */
  const handlePolicyDemographicOverrideChange = (demoKey, field) => (eOrNull) => {
    if (!eOrNull || !eOrNull.target) {
      debouncedSetPolicies.flush();
      return;
    }
    const { value } = eOrNull.target;
    setPolicies((prev) => {
      const next = setNested("byDemographic", demoKey, field, value, prev);
      debouncedSetPolicies(next);
      return next;
    });
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          Error: {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
            Policies
          </Typography>

          {policies ? (
            <PolicyAccordion
              policyParams={policies}
              // Globals
              handlePolicyChange={handlePolicyChange}
              // Advanced overrides
              handlePolicyIndustryOverrideChange={handlePolicyIndustryOverrideChange}
              handlePolicyDemographicOverrideChange={handlePolicyDemographicOverrideChange}
              starting={false}
            />
          ) : null}
        </Grid>

        <ChangeableParameters />
      </Grid>
    </Box>
  );
}
