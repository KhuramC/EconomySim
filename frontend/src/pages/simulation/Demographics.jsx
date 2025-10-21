// src/pages/simulation/Demographics.jsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/**
 * READ-ONLY Demographics view
 * - Values are DISPLAY-ONLY during the simulation
 * - Includes per-class Spending Behavior (fallbacks to a uniform global value)
 */

// Demo industry keys used for spending behavior breakdown
const INDUSTRIES = [
  "Utilities",
  "Housing",
  "Groceries",
  "Entertainment",
  "Luxury Goods",
  "Gas",
];

export default function Demographics() {
  // Demo date (wire to real simulation clock later)
  const year = 5;
  const week = 5;
  const totalWeeks = 52;

  // Display-only demo data (replace with real state/props later)
  const [groups] = useState({
    lower: {
      share: 40,
      income: 30000,
      savingsRate: 5,
      unemployment: 9,
      // Optional per-class spending behavior map (percent-of-income per industry)
      spending: {
        Utilities: 18,
        Housing: 35,
        Groceries: 25,
        Entertainment: 6,
        "Luxury Goods": 2,
        Gas: 8,
      },
    },
    middle: {
      share: 55,
      income: 80000,
      savingsRate: 12,
      unemployment: 4,
      spending: {
        Utilities: 12,
        Housing: 28,
        Groceries: 18,
        Entertainment: 12,
        "Luxury Goods": 10,
        Gas: 8,
      },
    },
    upper: {
      share: 5,
      income: 500000,
      savingsRate: 25,
      unemployment: 1,
      spending: {
        Utilities: 8,
        Housing: 20,
        Groceries: 10,
        Entertainment: 18,
        "Luxury Goods": 30,
        Gas: 4,
      },
    },
  });

  // Global parameters (basically mirrors what exists in SetupPage)
  const [globalParams] = useState({
    meanIncome: 50000,
    incomeStd: 15000,
    populationDistribution: 100,
    spendingBehaviorPct: 70, // if no per-class map, use this % uniformly per industry (demo fallback)
    meanSavings: 10000,
    savingsStd: 5000,
    startingUnemploymentRate: 0.05,
  });

  const formattedUnemp = useMemo(
    () => (globalParams.startingUnemploymentRate * 100).toFixed(2),
    [globalParams.startingUnemploymentRate]
  );

  return (
    <Box>
      {/* Top-right date (same placement as Overview/Statistics) */}
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
        {/* LEFT column: accordions for three classes + global parameters */}
        <Grid item xs={12} md={8}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
            Demographics
          </Typography>

          {/* Class accordions */}
          <ClassAccordion
            title="Lower Class"
            data={groups.lower}
            globalSpendingFallbackPct={globalParams.spendingBehaviorPct}
            defaultExpanded
          />
          <ClassAccordion
            title="Middle Class"
            data={groups.middle}
            globalSpendingFallbackPct={globalParams.spendingBehaviorPct}
          />
          <ClassAccordion
            title="Upper Class"
            data={groups.upper}
            globalSpendingFallbackPct={globalParams.spendingBehaviorPct}
          />

          {/* Global Demographic Parameters — accordion */}
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Global Demographic Parameters
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <ReadOnlyField
                    label="Mean Income ($)"
                    value={formatCurrency(globalParams.meanIncome)}
                    adornStart="$"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ReadOnlyField
                    label="Income Std. Deviation ($)"
                    value={formatCurrency(globalParams.incomeStd)}
                    adornStart="$"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <ReadOnlyField
                    label="Population Distribution (%)"
                    value={String(globalParams.populationDistribution)}
                    adornEnd="%"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ReadOnlyField
                    label="Spending Behavior (% Income, default)"
                    value={String(globalParams.spendingBehaviorPct)}
                    adornEnd="%"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <ReadOnlyField
                    label="Mean Savings ($)"
                    value={formatCurrency(globalParams.meanSavings)}
                    adornStart="$"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ReadOnlyField
                    label="Savings Std. Deviation ($)"
                    value={formatCurrency(globalParams.savingsStd)}
                    adornStart="$"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <ReadOnlyField
                    label="Starting Unemployment Rate"
                    value={formattedUnemp}
                    adornEnd="%"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* RIGHT column: brief note */}
        <Grid item xs={12} md={4} sx={{ display: "flex", flexDirection: "column" }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Notes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "left" }}>
              • Class values reflect the current simulation state.<br />
              • Editing is disabled while the simulation is running.<br />
              • Use Setup to change initial parameters.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

/**
 * ClassAccordion
 * - Single class (Lower/Middle/Upper) in an accordion.
 * - Shows read-only class metrics plus Spending Behavior breakdown by industry.
 * - If no per-class spending map is provided, falls back to a uniform global percentage.
 */
function ClassAccordion({ title, data, globalSpendingFallbackPct, defaultExpanded = false }) {
  // Build display map: prefer class-specific spending; otherwise fill with a uniform fallback
  const spendingMap = useMemo(() => {
    if (data?.spending && Object.keys(data.spending).length > 0) {
      return INDUSTRIES.map((k) => ({
        label: k,
        value: data.spending[k] ?? 0,
      }));
    }
    // Fallback: same % for all industries (demo only)
    return INDUSTRIES.map((k) => ({
      label: k,
      value: Number(globalSpendingFallbackPct ?? 0),
    }));
  }, [data?.spending, globalSpendingFallbackPct]);

  return (
    <Accordion defaultExpanded={defaultExpanded} sx={{ mb: 1 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {/* Class metrics */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <ReadOnlyField
              label="Population Share (%)"
              value={String(data.share)}
              adornEnd="%"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ReadOnlyField
              label="Average Household Income ($)"
              value={formatCurrency(data.income)}
              adornStart="$"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ReadOnlyField
              label="Savings Rate (% of income)"
              value={String(data.savingsRate)}
              adornEnd="%"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ReadOnlyField
              label="Unemployment Rate (%)"
              value={String(data.unemployment)}
              adornEnd="%"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Spending Behavior breakdown (read-only) */}
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
          Spending Behavior (% of income)
        </Typography>
        <Grid container spacing={1}>
          {spendingMap.map((row) => (
            <Grid key={row.label} item xs={12} sm={6} md={4}>
              <ReadOnlyField label={row.label} value={String(row.value)} adornEnd="%" />
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Quick summary line */}
        <Typography variant="body2" color="text.secondary">
          Share: <b>{data.share}%</b>&nbsp;•&nbsp; Income: <b>${formatCurrency(data.income)}</b>
          &nbsp;•&nbsp; Savings: <b>{data.savingsRate}%</b>&nbsp;•&nbsp; Unemployment:
          &nbsp;<b>{data.unemployment}%</b>
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
}

/**
 * ReadOnlyField
 * - Disabled TextField with optional $ or % adornments
 * - Keeps visual consistency with editable fields while preventing input
 */
function ReadOnlyField({ label, value, adornStart, adornEnd }) {
  return (
    <TextField
      label={label}
      fullWidth
      value={value}
      disabled
      InputProps={{
        readOnly: true,
        startAdornment: adornStart ? (
          <InputAdornment position="start">{adornStart}</InputAdornment>
        ) : undefined,
        endAdornment: adornEnd ? (
          <InputAdornment position="end">{adornEnd}</InputAdornment>
        ) : undefined,
      }}
    />
  );
}

/** Utility: format a number with thousand separators (no decimals by default) */
function formatCurrency(n) {
  const num = Number(n ?? 0);
  return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
