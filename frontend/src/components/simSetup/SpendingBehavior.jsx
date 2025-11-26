import { useMemo } from "react";
import ParameterSliderInput from "../inputs/ParameterSliderInput";
import { IndustryType } from "../../types/IndustryType";

/**
 * Spending Behavior component - displays industry spending sliders for a demographic.
 */
export default function SpendingBehavior({
  selectedDemographic,
  selectedDemo,
  handleDemographicChange,
  formErrors = {},
  readOnly = false,
}) {
  const industryEntries = useMemo(() => Object.values(IndustryType), []);

  // Extract nested error flags for the selected demo, if present
  const nestedErr = (formErrors && formErrors[selectedDemographic]) || {};

  // Spending row: mark all cells red ONLY when:
  // - nested flags per cell exist, OR
  // - the specific flat spending-row error key exists.
  const spendingRowInvalid =
    industryEntries.some(([k]) => !!nestedErr[k]) ||
    !!formErrors[`demo_spending_${selectedDemographic}`];

  return (
    <>
      {industryEntries.map((industry) => (
        <ParameterSliderInput
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
}
