import { useMemo, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import UnchangeableParameters from "../../components/simView/UnchangeableParameters";
import { Demographic } from "../../types/Demographic";
import { IndustryType } from "../../types/IndustryType";
/**
 * READ-ONLY Demographics view
 * - Values are DISPLAY-ONLY during the simulation
 * - Includes per-class Spending Behavior (fallbacks to a uniform global value)
 */

export default function Demographics() {
  // Display-only demo data (replace with real state/props later)
  const [groups] = useState({
    lower: {
      share: 40,
      income: 30000,
      savingsRate: 5,
      // Optional per-class spending behavior map (percent-of-income per industry)
      spending: {
        Groceries: 25,
        Utilities: 18,
        Automobiles: 8,
        Housing: 35,
        "Household Goods": 2,
        Entertainment: 6,
        Luxury: 2,
      },
    },
    middle: {
      share: 55,
      income: 80000,
      savingsRate: 12,
      spending: {
        Groceries: 25,
        Utilities: 18,
        Automobiles: 8,
        Housing: 35,
        "Household Goods": 2,
        Entertainment: 6,
        Luxury: 2,
      },
    },
    upper: {
      share: 5,
      income: 500000,
      savingsRate: 25,
      spending: {
        Groceries: 25,
        Utilities: 18,
        Automobiles: 8,
        Housing: 35,
        "Household Goods": 2,
        Entertainment: 6,
        Luxury: 2,
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
  });

  return (
    <Box>
      <Grid container spacing={3}>
        {/* LEFT column: accordions for three classes + global parameters */}
        <Grid size={{ xs: 12, md: 8 }}>
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
                <Grid size={{ xs: 12, md: 6 }}>
                  <ReadOnlyField
                    label="Mean Income ($)"
                    value={formatCurrency(globalParams.meanIncome)}
                    adornStart="$"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ReadOnlyField
                    label="Income Std. Deviation ($)"
                    value={formatCurrency(globalParams.incomeStd)}
                    adornStart="$"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <ReadOnlyField
                    label="Population Distribution (%)"
                    value={String(globalParams.populationDistribution)}
                    adornEnd="%"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ReadOnlyField
                    label="Spending Behavior (% Income, default)"
                    value={String(globalParams.spendingBehaviorPct)}
                    adornEnd="%"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <ReadOnlyField
                    label="Mean Savings ($)"
                    value={formatCurrency(globalParams.meanSavings)}
                    adornStart="$"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ReadOnlyField
                    label="Savings Std. Deviation ($)"
                    value={formatCurrency(globalParams.savingsStd)}
                    adornStart="$"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <UnchangeableParameters />
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
function ClassAccordion({
  title,
  data,
  globalSpendingFallbackPct,
  defaultExpanded = false,
}) {
  // Build display map: prefer class-specific spending; otherwise fill with a uniform fallback
  const spendingMap = useMemo(() => {
    if (data?.spending && Object.keys(data.spending).length > 0) {
      return Object.values(IndustryType).map((k) => ({
        label: k,
        value: data.spending[k] ?? 0,
      }));
    }
    // Fallback: same % for all industries (demo only)
    return Object.values(IndustryType).map((k) => ({
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
          <Grid size={{ xs: 12, md: 6 }}>
            <ReadOnlyField
              label="Population Share (%)"
              value={String(data.share)}
              adornEnd="%"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ReadOnlyField
              label="Average Household Income ($)"
              value={formatCurrency(data.income)}
              adornStart="$"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ReadOnlyField
              label="Savings Rate (% of income)"
              value={String(data.savingsRate)}
              adornEnd="%"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid key={row.label} size={{ xs: 12, sm: 6, md: 4 }}>
              <ReadOnlyField
                label={row.label}
                value={String(row.value)}
                adornEnd="%"
              />
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Quick summary line */}
        <Typography variant="body2" color="text.secondary">
          Share: <b>{data.share}%</b>&nbsp;•&nbsp; Income:{" "}
          <b>${formatCurrency(data.income)}</b>
          &nbsp;•&nbsp; Savings: <b>{data.savingsRate}%</b>&nbsp;•&nbsp;
          Unemployment: &nbsp;<b>{data.unemployment}%</b>
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
