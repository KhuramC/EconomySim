// src/pages/simulation/Industries.jsx
import React, { useMemo } from "react";
import { Box, Grid, Typography, Paper } from "@mui/material";
import IndustryAccordion from "../../components/SimSetup/IndustryAccordion.jsx";
import { IndustryType } from "../../types/IndustryType.js";

/**
 * Read-only Industries view
 */
export default function Industries({ industryParams }) {
  // Demo clock (wire to real simulation clock later)
  const year = 5;
  const week = 5;
  const totalWeeks = 52;

  // Baseline defaults for any missing fields
  const baseline = {
    startingInventory: 1000,
    startingPrice: 10,
    industrySavings: 50000,
    offeredWage: 15,
  };

  // Fill in ALL IndustryType keys with safe values
  const filledParams = useMemo(() => {
    const result = {};
    for (const key of Object.values(IndustryType)) {
      const p = industryParams?.[key] ?? {};
      result[key] = {
        startingInventory:
          p.startingInventory ?? baseline.startingInventory,
        startingPrice:
          p.startingPrice ?? baseline.startingPrice,
        industrySavings:
          p.industrySavings ?? baseline.industrySavings,
        offeredWage:
          p.offeredWage ?? baseline.offeredWage,
      };
    }
    return result;
  }, [industryParams]);

  return (
    <Box>
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
        {/* LEFT column: main content */}
        <Grid item xs={12} md={8}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
            Industries
          </Typography>

          {/* Uses existing accordion; safe because all keys are present */}
          <IndustryAccordion
            industryParams={filledParams}
            // If you don’t support editing here, pass a no-op HOF to avoid errors:
            // IndustryAccordion expects a higher-order handler: (k, f) => (e) => {}
            handleIndustryChange={() => () => {}}
          />
        </Grid>

        {/* RIGHT column: notes card (mirrors Policies.jsx) */}
        <Grid item xs={12} md={4} sx={{ display: "flex", flexDirection: "column" }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Notes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "left" }}>
              • These values are based on initial setup parameters.<br />
              • Changes are locked while the simulation is running.<br />
              • Use Setup to adjust them before starting a new run.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

