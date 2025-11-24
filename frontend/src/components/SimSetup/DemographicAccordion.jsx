import { useMemo, useState } from "react";
import { MenuItem, Grid } from "@mui/material";
import ParameterAccordion from "./ParameterAccordion.jsx";
import ParameterMenuInput from "../inputs/ParameterMenuInput.jsx";
import ParameterNumInput from "../inputs/ParameterNumInput.jsx";
import ParameterSliderInput from "../inputs/ParameterSliderInput.jsx";
import { Demographic } from "../../types/Demographic.js";
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
  readOnly = false,
}) {
  const demographics = useMemo(() => Object.values(Demographic), []);
  const industryEntries = useMemo(() => Object.values(IndustryType), []);
  const [selectedDemographic, setSelectedDemographic] = useState(
    demographics[0]
  );

  const selectedDemo = demoParams[selectedDemographic] || {};

  // Extract nested error flags for the selected demo, if present
  const nestedErr = (formErrors && formErrors[selectedDemographic]) || {};

  // Backward-compatible helpers to detect errors from either nested flags or flat keys
  const hasProportionError = !!nestedErr.proportion || !!formErrors.proportion;

  const hasMeanIncomeError =
    !!nestedErr.meanIncome ||
    !!formErrors[`demo_meanIncome_${selectedDemographic}`] ||
    !!formErrors[`demo_meanIncome_monotonic_${selectedDemographic}`];

  const hasSdIncomeError =
    !!nestedErr.sdIncome ||
    !!formErrors[`demo_sdIncome_${selectedDemographic}`];

  const hasMeanSavingsError =
    !!nestedErr.meanSavings ||
    !!formErrors[`demo_meanSavings_${selectedDemographic}`];

  const hasSdSavingsError =
    !!nestedErr.sdSavings ||
    !!formErrors[`demo_sdSavings_${selectedDemographic}`];

  // Spending row: mark all cells red ONLY when:
  // - nested flags per cell exist, OR
  // - the specific flat spending-row error key exists.
  // NOTE: Do NOT use `formErrors[selected]` as a fallback (it over-highlights unrelated errors).
  const spendingRowInvalid =
    industryEntries.some(([k]) => !!nestedErr[k]) ||
    !!formErrors[`demo_spending_${selectedDemographic}`];

  // Handler for demographic selector dropdown
  const handleSelectedDemographicChange = (event) => {
    setSelectedDemographic(event.target.value);
  };

  const demographicSelector = (
    <ParameterMenuInput
      label="Demographic"
      value={selectedDemographic}
      onChange={handleSelectedDemographicChange}
      xs={12}
      helpText="Choose which demographic group you are editing. Values below apply only to this group."
    >
      {demographics.map((value) => (
        // Create a MenuItem for each Demographic
        <MenuItem key={value} value={value}>
          <span>{value}</span>
        </MenuItem>
      ))}
    </ParameterMenuInput>
  );

  const coreContent = (
    <>
      <ParameterSliderInput
        label="Proportion of Population (%)"
        value={selectedDemo.proportion}
        onChange={handleDemographicChange(selectedDemographic, "proportion")}
        error={hasProportionError}
        readOnly={readOnly}
        helpText="Share of the total population in this demographic. All demographics together must sum to 100%."
        spacing={7.5}
      />

      <ParameterNumInput
        label="Mean Income ($/week)"
        value={selectedDemo.meanIncome}
        onChange={handleDemographicChange(selectedDemographic, "meanIncome")}
        error={hasMeanIncomeError}
        readOnly={readOnly}
        helpText="Target average weekly income used for sampling individual incomes. Larger values raise purchasing power."
      />

      <ParameterNumInput
        label="Income Std. Deviation ($)"
        value={selectedDemo.sdIncome}
        onChange={handleDemographicChange(selectedDemographic, "sdIncome")}
        error={hasSdIncomeError}
        readOnly={readOnly}
        helpText="Spread of weekly incomes around the mean (lognormal). Higher values increase inequality and volatility."
      />

      <ParameterNumInput
        label="Mean Savings ($)"
        value={selectedDemo.meanSavings}
        onChange={handleDemographicChange(selectedDemographic, "meanSavings")}
        error={hasMeanSavingsError}
        readOnly={readOnly}
        helpText="Average starting cash on hand. Higher savings allow households to smooth consumption."
      />

      <ParameterNumInput
        label="Savings Std. Deviation ($)"
        value={selectedDemo.sdSavings}
        onChange={handleDemographicChange(selectedDemographic, "sdSavings")}
        error={hasSdSavingsError}
        readOnly={readOnly}
        helpText="Variation in starting savings between people. Larger values create more heterogeneous behavior."
      />
    </>
  );

  const advancedContent = (
    <>
      {industryEntries.map((industry) => (
        <ParameterNumInput
          key={`spendingBehavior-${industry}`}
          label={industry + " Spending (%)"}
          value={selectedDemo?.[industry] ?? ""}
          onChange={handleDemographicChange(selectedDemographic, industry)}
          readOnly={readOnly}
          // Mark each cell red if the row is invalid OR that cell is flagged.
          error={spendingRowInvalid || !!nestedErr[industry]}
          helpText={`Share of this group's income allocated to ${industry.toLowerCase()}. Row should total 100%.`}
        />
      ))}
    </>
  );

  return (
    <ParameterAccordion
      title="Demographic Parameters"
      selector={demographicSelector}
      advancedContent={advancedContent}
      advancedTitle="Spending Behavior by Industry"
    >
      {coreContent}
    </ParameterAccordion>
  );
}
