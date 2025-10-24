import React, { useMemo, useState, useEffect } from "react";
import { Box, Grid, Typography, Paper, Alert } from "@mui/material";
import PolicyAccordion from "../../components/SimSetup/PolicyAccordion.jsx";

/**
 * Policies page
 *
 * Props:
 *  - policyParams?: object
 *  - handlePolicyChange?: (field: string) => (event) => void
 *  - formErrors?: object
 *  - isSimRunning?: boolean
 */
export default function Policies({
  policyParams,
  handlePolicyChange,
  formErrors = {},
  isSimRunning = true,
}) {
  // Demo clock (wire to real simulation clock later)
  const year = 5;
  const week = 5;
  const totalWeeks = 52;

  // Safe defaults
  const defaults = useMemo(
    () => ({
      salesTax: 7,
      corporateTax: 21,
      personalIncomeTax: 15,
      propertyTax: 10,
      tariffs: 5,
      subsidies: 20,
      rentCap: 200,
      minimumWage: 7.25,
    }),
    []
  );

  // ---- Local state fallback when parent does NOT provide a handler ----
  // Initialize local with merged defaults + props
  const [localPolicies, setLocalPolicies] = useState({
    ...defaults,
    ...(policyParams ?? {}),
  });

  // If parent updates policyParams later, sync into local
  useEffect(() => {
    if (policyParams) {
      setLocalPolicies((prev) => ({ ...prev, ...policyParams }));
    }
  }, [policyParams]);

  // Decide which data + handler to use:
  const usingParentHandler = typeof handlePolicyChange === "function";
  const data = usingParentHandler
    ? { ...defaults, ...(policyParams ?? {}) }
    : localPolicies;

  // Fallback handler (matches HOF signature expected by PolicyAccordion)
  const fallbackHandlePolicyChange = (field) => (event) => {
    const raw = event?.target?.value;
    // MUI number fields still give strings; allow empty string, else coerce to number
    const next = raw === "" ? "" : Number(raw);
    setLocalPolicies((prev) => ({ ...prev, [field]: next }));
  };

  const effectiveHandlePolicyChange =
    handlePolicyChange ?? fallbackHandlePolicyChange;

  return (
    <Box>
      {/* Top-right date */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "right" }}>
          Year {year} &nbsp;&nbsp; Week {week} of {totalWeeks}
        </Typography>
      </Box>


      <Grid container spacing={3}>
        {/* LEFT column: main content (editable) */}
        <Grid item xs={12} md={8}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
            Policies
          </Typography>

          {/* Always editable: use team’s accordion with effective data/handler */}
          <PolicyAccordion
            policyParams={data}
            handlePolicyChange={effectiveHandlePolicyChange}
            formErrors={formErrors}
          />
        </Grid>

        {/* RIGHT column: notes */}
        <Grid item xs={12} md={4} sx={{ display: "flex", flexDirection: "column" }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Notes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "left" }}>
              • These values can be adjusted while the simulation is running.<br />
              • Use Setup for initial values; refine here during a run as needed.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

