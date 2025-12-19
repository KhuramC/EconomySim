import { useMemo, useState } from "react";
import { MenuItem } from "@mui/material";
import ParameterAccordion from "./ParameterAccordion";
import ParameterMenuInput from "../inputs/ParameterMenuInput";
import ParameterNumInput from "../inputs/ParameterNumInput";
import ParameterSliderInput from "../inputs/ParameterSliderInput";
import { Demographic } from "../../types/Demographic";

/**
 * Demographic Read only parameters viewer.
 * - Highlights invalid fields in red based on `formErrors`.
 * - Compatible with two shapes of `formErrors`:
 *    1) Nested flags: formErrors[demoKey][field] === true
 *    2) Flat messages: "proportion", `demo_spending_${demoKey}`, etc.
 * - Shows a row total for spending behavior (turns red when not 100%).
 */
export default function DemographicAccordion({
  demoParams,
  handleDemographicChange,
}) {
  const demographics = useMemo(() => Object.values(Demographic), []);
  const [selectedDemographic, setSelectedDemographic] = useState(
    demographics[0]
  );

  const readOnly = true;
  const selectedDemo = demoParams[selectedDemographic] || {};

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
        readOnly={readOnly}
        helpText="Share of the total population in this demographic. All demographics together must sum to 100%."
      />

      <ParameterNumInput
        label="Mean Income ($/week)"
        value={selectedDemo.meanIncome}
        onChange={handleDemographicChange(selectedDemographic, "meanIncome")}
        readOnly={readOnly}
        helpText="Target average weekly income used for sampling individual incomes. Larger values raise purchasing power."
      />

      <ParameterNumInput
        label="Income Std. Deviation ($)"
        value={selectedDemo.sdIncome}
        onChange={handleDemographicChange(selectedDemographic, "sdIncome")}
        readOnly={readOnly}
        helpText="Spread of weekly incomes around the mean (lognormal). Higher values increase inequality and volatility."
      />

      <ParameterNumInput
        label="Mean Savings ($)"
        value={selectedDemo.meanSavings}
        onChange={handleDemographicChange(selectedDemographic, "meanSavings")}
        readOnly={readOnly}
        helpText="Average starting cash on hand. Higher savings allow households to smooth consumption."
      />

      <ParameterNumInput
        label="Savings Std. Deviation ($)"
        value={selectedDemo.sdSavings}
        onChange={handleDemographicChange(selectedDemographic, "sdSavings")}
        readOnly={readOnly}
        helpText="Variation in starting savings between people. Larger values create more heterogeneous behavior."
      />
    </>
  );

  return (
    <ParameterAccordion
      title="Demographic Parameters"
      selector={demographicSelector}
    >
      {coreContent}
    </ParameterAccordion>
  );
}
