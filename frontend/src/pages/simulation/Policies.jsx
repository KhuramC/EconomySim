// src/pages/simulation/Policies.jsx
import React from "react";
import {
  Box,
  Grid,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Paper,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/**
 * Read-only Policies view
 */
export default function Policies() {
  // Demo clock (wire to real simulation clock later)
  const year = 5;
  const week = 5;
  const totalWeeks = 52;

  // Static demo values (display only)
  const policies = {
    salesTax: 7,
    corporateTax: 21,
    personalIncomeTax: 15,
    propertyTax: 1000,
    tariffs: 5,
    subsidies: 2000,
    rentCap: 2000,
    minimumWage: 10,
  };

  return (
    // NOTE: No outer Paper here; this page is rendered inside BaseSimView's container.
    <Box>
      {/* Top-right date (kept consistent across pages) */}
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
          {/* Page title and subtitle */}
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
            Policies
          </Typography>

          {/* Single accordion (like Setup) */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Government Policy Parameters
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <ReadOnlyField label="Sales Tax" value={policies.salesTax} adornEnd="%" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ReadOnlyField label="Corporate Income Tax" value={policies.corporateTax} adornEnd="%" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ReadOnlyField label="Personal Income Tax" value={policies.personalIncomeTax} adornEnd="%" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ReadOnlyField label="Property Tax" value={policies.propertyTax} adornStart="$" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ReadOnlyField label="Tariffs" value={policies.tariffs} adornEnd="%" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ReadOnlyField label="Subsidies" value={policies.subsidies} adornStart="$" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ReadOnlyField label="Rent Cap" value={policies.rentCap} adornStart="$" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ReadOnlyField
                    label="Minimum Wage"
                    value={policies.minimumWage}
                    adornStart="$"
                    adornEnd="/hr"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* RIGHT column: notes card (kept consistent with other pages) */}
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

/**
 * Reusable read-only MUI text field (grayed out)
 * - Uses slotProps.input instead of deprecated InputProps
 * - Supports start/end adornments (e.g., "$" or "%")
 */
function ReadOnlyField({ label, value, adornStart, adornEnd }) {
  return (
    <TextField
      label={label}
      fullWidth
      value={value}
      disabled
      slotProps={{
        input: {
          readOnly: true,
          startAdornment: adornStart ? (
            <InputAdornment position="start">{adornStart}</InputAdornment>
          ) : undefined,
          endAdornment: adornEnd ? (
            <InputAdornment position="end">{adornEnd}</InputAdornment>
          ) : undefined,
        },
      }}
    />
  );
}
