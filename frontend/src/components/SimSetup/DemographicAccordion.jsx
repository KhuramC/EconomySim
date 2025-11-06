import { useMemo, useState } from "react";
import {
  MenuItem,
  Divider,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import ParameterMenuInput from "./ParameterMenuInput.jsx";
import ParameterNumInput from "./ParameterNumInput.jsx";
import { Demographic } from "../../types/Demographic.js";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { IndustryType } from "../../types/IndustryType.js";

/**
 * Demographic parameters editor.
 * - Highlights invalid fields in red based on `formErrors`.
 * - Compatible with two shapes of `formErrors`:
 *    1) Nested flags: formErrors[demoKey][field] === true
 *    2) Flat messages: "proportion", `demo_spending_${demoKey}`, etc.
 * - Shows a row total for spending behavior (turns red when not 100%).
 */
export default function DemographicAccordion({
  demoParams,
  handleDemographicChange,
  formErrors = {},
  starting = true,
  readOnly = false,
}) {
  const demographics = useMemo(() => Object.values(Demographic), []);
  const industryEntries = useMemo(() => Object.entries(IndustryType), []);
  const [selectedDemographic, setSelectedDemographic] = useState(demographics[0]);

  const selected = selectedDemographic;
  const selectedDemo = demoParams[selected] || {};

  // Extract nested error flags for the selected demo, if present
  const nestedErr = (formErrors && formErrors[selected]) || {};

  // Backward-compatible helpers to detect errors from either nested flags or flat keys
  const hasProportionError =
    !!nestedErr.proportion || !!formErrors.proportion;

  const hasUnempError =
    !!nestedErr.unemploymentRate || !!formErrors[`demo_unemp_${selected}`];

  const hasMeanIncomeError =
    !!nestedErr.meanIncome ||
    !!formErrors[`demo_meanIncome_${selected}`] ||
    !!formErrors[`demo_meanIncome_monotonic_${selected}`];

  const hasSdIncomeError =
    !!nestedErr.sdIncome || !!formErrors[`demo_sdIncome_${selected}`];

  const hasMeanSavingsError =
    !!nestedErr.meanSavings || !!formErrors[`demo_meanSavings_${selected}`];

  const hasSdSavingsError =
    !!nestedErr.sdSavings || !!formErrors[`demo_sdSavings_${selected}`];

  // Spending row: mark all cells red ONLY when:
  // - nested flags per cell exist, OR
  // - the specific flat spending-row error key exists.
  // NOTE: Do NOT use `formErrors[selected]` as a fallback (it over-highlights unrelated errors).
  const spendingRowInvalid =
    industryEntries.some(([k]) => !!nestedErr[k]) ||
    !!formErrors[`demo_spending_${selected}`];

  // Compute row total for visual hint (not required, but helpful)
  const spendingTotal = industryEntries.reduce(
    (sum, [upperKey]) => sum + (Number(selectedDemo?.[upperKey]) || 0),
    0
  );

  // Handler for demographic selector dropdown
  const handleSelectedDemographicChange = (event) => {
    setSelectedDemographic(event.target.value);
  };

  return (
    <Accordion defaultExpanded={false}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">Demographic Parameters</Typography>
      </AccordionSummary>

      <AccordionDetails>
        <Grid container spacing={2}>
          <ParameterMenuInput
            label="Demographic"
            value={selected}
            onChange={handleSelectedDemographicChange}
            xs={12}
          >
            {demographics.map((value) => (
              
              <MenuItem key={value} value={value}>
                <span style={{ textTransform: "capitalize" }}>{value}</span>
              </MenuItem>
            ))}
          </ParameterMenuInput>

          <ParameterNumInput
            label="Proportion of Population (%)"
            value={selectedDemo.proportion}
            onChange={handleDemographicChange(selected, "proportion")}
            error={hasProportionError}
            readOnly={readOnly}
          />

          <ParameterNumInput
            label={
              starting === true
                ? "Starting Unemployment Rate (%)"
                : "Unemployment Rate (%)"
            }
            value={selectedDemo.unemploymentRate}
            onChange={handleDemographicChange(selected, "unemploymentRate")}
            error={hasUnempError}
            readOnly={readOnly}
          />

          <ParameterNumInput
            label="Mean Income ($/week)"
            value={selectedDemo.meanIncome}
            onChange={handleDemographicChange(selected, "meanIncome")}
            error={hasMeanIncomeError}
            readOnly={readOnly}
          />

          <ParameterNumInput
            label="Income Std. Deviation ($)"
            value={selectedDemo.sdIncome}
            onChange={handleDemographicChange(selected, "sdIncome")}
            error={hasSdIncomeError}
            readOnly={readOnly}
          />

          <ParameterNumInput
            label="Mean Savings ($)"
            value={selectedDemo.meanSavings}
            onChange={handleDemographicChange(selected, "meanSavings")}
            error={hasMeanSavingsError}
            readOnly={readOnly}
          />

          <ParameterNumInput
            label="Savings Std. Deviation ($)"
            value={selectedDemo.sdSavings}
            onChange={handleDemographicChange(selected, "sdSavings")}
            error={hasSdSavingsError}
            readOnly={readOnly}
          />
        </Grid>

        {/* Spending section */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Spending Behavior (% of income)
        </Typography>

        <Grid container spacing={1}>
          {industryEntries.map(([upperKey, label]) => (
            <Grid key={`spendingBehavior-${upperKey}`} item xs={12} sm={6} md={4}>
              <ParameterNumInput
                label={label}
                value={selectedDemo?.[upperKey] ?? ""}
                onChange={handleDemographicChange(selected, upperKey)}
                readOnly={readOnly}
                // Mark each cell red if the row is invalid OR that cell is flagged.
                error={spendingRowInvalid || !!nestedErr[upperKey]}
              />
            </Grid>
          ))}

          {/* Row total hint */}
          <Grid item xs={12}>
            <Typography
              variant="caption"
              sx={{ display: "block", mt: 0.5 }}
              color={Math.round(spendingTotal) === 100 ? "text.secondary" : "error"}
            >
              Row total: {spendingTotal.toFixed(1)}%
              {Math.round(spendingTotal) === 100 ? "" : " (should be 100%)"}
            </Typography>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}
