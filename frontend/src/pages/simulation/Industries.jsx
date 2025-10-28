import { useMemo } from "react";
import { Box, Grid, Typography } from "@mui/material";
import IndustryAccordion from "../../components/SimSetup/IndustryAccordion.jsx";
import { IndustryType } from "../../types/IndustryType.js";
import UnchangeableParameters from "../../components/SimView/UnchangeableParameters.jsx";

/**
 * Read-only Industries view
 */
export default function Industries({ industryParams }) {
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
        startingInventory: p.startingInventory ?? baseline.startingInventory,
        startingPrice: p.startingPrice ?? baseline.startingPrice,
        industrySavings: p.industrySavings ?? baseline.industrySavings,
        offeredWage: p.offeredWage ?? baseline.offeredWage,
      };
    }
    return result;
  }, [industryParams]);

  return (
    <Box>
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
            starting={false}
          />
        </Grid>

        <UnchangeableParameters />
      </Grid>
    </Box>
  );
}
