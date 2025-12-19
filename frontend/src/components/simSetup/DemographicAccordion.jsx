import { useMemo, useState } from "react";
import { MenuItem } from "@mui/material";
import ParameterAccordion from "./ParameterAccordion";
import ParameterMenuInput from "../inputs/ParameterMenuInput";
import ParameterNumInput from "../inputs/ParameterNumInput";
import ParameterSliderInput from "../inputs/ParameterSliderInput";
import SpendingBehavior from "./SpendingBehavior";
import { Demographic } from "../../types/Demographic";
import { IndustryType } from "../../types/IndustryType";

/**
 * Demographic parameters editor.
 * - Highlights invalid fields in red based on `formErrors`.
 * - Compatible with two shapes of `formErrors`:
 *    1) Nested flags: formErrors[demoKey][field] === true
 *    2) Flat messages: "proportion", `demo_spending_${demoKey}`, etc.
 * - Shows a row total for spending behavior (turns red when not 100%).
 */
export default function DemographicAccordion({
  populationParams,
  handlePopulationChange,
  handlePopulationSpendingChange,
  formErrors = {},
  readOnly = false,
}) {
  const demographics = useMemo(() => Object.values(Demographic), []);

  const [selectedSpendingDemo, setSelectedSpendingDemo] = useState(
    demographics[0]
  );

  // Global field errors
  const hasIncomeMeanError = !!formErrors.pop_incomeMean;
  const hasIncomeStdError = !!formErrors.pop_incomeStd;
  const hasBalanceMeanError = !!formErrors.pop_balanceMean;
  const hasBalanceStdError = !!formErrors.pop_balanceStd;

  // Spending field errors
  const spendingErrorsForDemo = formErrors.population?.spending?.[selectedSpendingDemo] || {};
  const hasSpendingSumError = !!formErrors[`pop_spending_${selectedSpendingDemo}`];

  // Handler for the demographic selector inside the Advanced section
  const handleSpendingDemoChange = (event) => {
    setSelectedSpendingDemo(event.target.value);
  };

  const coreContent = (
    <>
      <ParameterNumInput
        label="Mean Income ($/week)"
        value={populationParams.incomeMean}
        onChange={handlePopulationChange("incomeMean")}
        error={hasIncomeMeanError}
        readOnly={readOnly}
        helpText="The average weekly income for the entire population. This determines the center of the lognormal distribution."
      />

      <ParameterNumInput
        label="Income Std. Deviation ($)"
        value={populationParams.incomeStd}
        onChange={handlePopulationChange("incomeStd")}
        error={hasIncomeStdError}
        readOnly={readOnly}
        helpText="The spread of incomes. Higher values create higher inequality, pushing more people into Lower/Upper classes."
      />

      <ParameterNumInput
        label="Mean Savings ($)"
        value={populationParams.balanceMean}
        onChange={handlePopulationChange("balanceMean")}
        error={hasBalanceMeanError}
        readOnly={readOnly}
        helpText="The average starting cash on hand for the population."
      />

      <ParameterNumInput
        label="Savings Std. Deviation ($)"
        value={populationParams.balanceStd}
        onChange={handlePopulationChange("balanceStd")}
        error={hasBalanceStdError}
        readOnly={readOnly}
        helpText="The variation in starting savings across the population."
      />
    </>
  );

  const advancedContent = readOnly ? undefined : (
    <>
      <ParameterMenuInput
        label="Select Demographic Group"
        value={selectedSpendingDemo}
        onChange={handleSpendingDemoChange}
        xs={12}
        helpText="Select a demographic to edit their specific spending preferences."
      >
        {demographics.map((value) => (
          <MenuItem key={value} value={value}>
            <span>{value}</span>
          </MenuItem>
        ))}
      </ParameterMenuInput>

      <SpendingBehavior
        selectedDemographic={selectedSpendingDemo}
        // Pass the spending dictionary for *only* the selected demographic
        selectedDemo={populationParams.spendingBehaviors[selectedSpendingDemo] || {}}
        // The SpendingBehavior component expects a handler that takes (demo, industry)
        // We pass our wrapper which already knows how to handle that structure
        handleDemographicChange={(demo, industry) => handlePopulationSpendingChange(demo, industry)}
        
        // Pass specific error flags if available, or the general sum error
        formErrors={hasSpendingSumError ? { [selectedSpendingDemo]: true } : {}} 
        readOnly={readOnly}
      />
    </>
  );

  return (
    <ParameterAccordion
      title="Population Parameters"
      advancedContent={advancedContent}
      advancedTitle="Spending Behavior"
    >
      {coreContent}
    </ParameterAccordion>
  );
}
