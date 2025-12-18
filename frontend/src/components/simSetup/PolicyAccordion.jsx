import { useMemo, useState } from "react";
import { MenuItem } from "@mui/material";

import ParameterNumInput from "../inputs/ParameterNumInput";
import ParameterSliderInput from "../inputs/ParameterSliderInput";
import ToggleableSliderInput from "../inputs/ToggleableSliderInput";
import ParameterAccordion from "./ParameterAccordion";
import PersonalIncomeTaxBracket from "./PersonalIncomeTaxBracket";
import ParameterMenuInput from "../inputs/ParameterMenuInput";
import { IndustryType } from "../../types/IndustryType";
import { Demographic } from "../../types/Demographic";

/**
 * Policy section UI.
 *
 * Core:
 *  - Global policy fields (sales tax, corporate tax, PIT, property tax, etc.).
 *
 * Advanced:
 *  - Per-industry overrides:
 *      - sales tax, corporate tax, tariffs, subsidies, price cap (+ enable flag).
 *  - Per-demographic overrides:
 *      - personal income tax (PIT) brackets by demographic.
 *
 * Props:
 *  - policyParams: full policy state used to build backend payloads.
 *  - handlePolicyChange: handler for global scalar policy fields.
 *  - handleIndustryPolicyChange: handler for per-industry policy overrides.
 *  - formErrors: optional error flags for validation (mostly used in setup).
 *  - starting: if true, we are in the Setup page; false means runtime Policies view.
 *  - handlePriceCapToggle: toggles global price cap enabled/disabled.
 *  - handlePersonalIncomeTaxChange: handler for global PIT brackets.
 *  - addPersonalIncomeTaxBracket / removePersonalIncomeTaxBracket: modify global PIT list.
 *  - handlePersonalIncomeTaxByDemoChange: handler for PIT brackets per demographic.
 *  - addPersonalIncomeTaxBracketForDemo / removePersonalIncomeTaxBracketForDemo:
 *      modify PIT brackets for the currently selected demographic.
 */
export default function PolicyAccordion({
  policyParams,
  handlePolicyChange,
  handleIndustryPolicyChange,
  formErrors = {},
  starting = true,
  handlePriceCapToggle,
  handlePersonalIncomeTaxChange,
  addPersonalIncomeTaxBracket,
  removePersonalIncomeTaxBracket,
  // By-demographic Personal Income Tax
  handlePersonalIncomeTaxByDemoChange,
  addPersonalIncomeTaxBracketForDemo,
  removePersonalIncomeTaxBracketForDemo,
}) {
  // --- Advanced: per-industry selection state ---
  const industryValues = useMemo(() => Object.values(IndustryType), []);
  const [selectedIndustry, setSelectedIndustry] = useState(industryValues[0]);

  const handleSelectedIndustryChange = (event) => {
    setSelectedIndustry(event.target.value);
  };

  /**
   * Returns an onChange handler for a given per-industry field
   * (e.g., "salesTaxByIndustry") bound to the currently selected industry.
   */
  const getIndustryOnChange = (fieldName) =>
    typeof handleIndustryPolicyChange === "function"
      ? handleIndustryPolicyChange(fieldName, selectedIndustry)
      : undefined;

  // --- Advanced: per-demographic selection state ---
  const demographicValues = useMemo(() => Object.values(Demographic), []);
  const [selectedDemographic, setSelectedDemographic] = useState(
    demographicValues[0]
  );

  const handleSelectedDemographicChange = (event) => {
    setSelectedDemographic(event.target.value);
  };

  /**
   * Returns a handler for editing a PIT bracket for the selected demographic.
   *
   * The returned function matches `PersonalIncomeTaxBracket`'s expectation:
   *   (index, field) → (event) → void
   */
  const getDemoBracketChangeHandler = (index, field) =>
    typeof handlePersonalIncomeTaxByDemoChange === "function"
      ? handlePersonalIncomeTaxByDemoChange(selectedDemographic, index, field)
      : undefined;

  /**
   * Add/remove PIT brackets for the currently selected demographic.
   */
  const addDemoBracket = () => {
    if (typeof addPersonalIncomeTaxBracketForDemo === "function") {
      addPersonalIncomeTaxBracketForDemo(selectedDemographic);
    }
  };

  const removeDemoBracket = (index) => {
    if (typeof removePersonalIncomeTaxBracketForDemo === "function") {
      removePersonalIncomeTaxBracketForDemo(selectedDemographic, index);
    }
  };

  // --- Core (global) policy fields ---
  const coreFields = (
    <>
      <ParameterSliderInput
        label="Sales Tax (%)"
        value={policyParams.salesTax}
        onChange={handlePolicyChange("salesTax")}
        error={!!formErrors.salesTax}
        helpText="Tax applied to consumer purchases. Increases effective prices and can dampen demand."
      />

      <ParameterSliderInput
        label="Corporate Income Tax (%)"
        value={policyParams.corporateTax}
        onChange={handlePolicyChange("corporateTax")}
        error={!!formErrors.corporateTax}
        helpText="Tax on industry profits. Reduces retained earnings and may affect investment."
      />

      <ParameterSliderInput
        label="Property Tax (%)"
        value={policyParams.propertyTax}
        onChange={handlePolicyChange("propertyTax")}
        error={!!formErrors.propertyTax}
        helpText="Recurring tax on property values. Can influence housing costs and investment."
      />

      <ToggleableSliderInput
        label="Price Cap (%/year)"
        value={policyParams.priceCap}
        isEnabled={policyParams.priceCapEnabled}
        setIsEnabled={handlePriceCapToggle}
        onChange={handlePolicyChange("priceCap")}
        error={!!formErrors.priceCap}
        helpText="The percentage above which industries cannot set their prices from the week before. Helps control inflation."
      />

      <ParameterSliderInput
        label="Tariffs (%)"
        value={policyParams.tariffs}
        onChange={handlePolicyChange("tariffs")}
        error={!!formErrors.tariffs}
        helpText="Import duties that raise costs of targeted goods. Can shift demand across industries."
      />

      <ParameterSliderInput
        label="Subsidies (%)"
        value={policyParams.subsidies}
        onChange={handlePolicyChange("subsidies")}
        error={!!formErrors.subsidies}
        helpText="Government support paid to industries. Lowers effective costs or boosts income."
      />

      <ParameterNumInput
        label="Minimum Wage ($/hr)"
        value={policyParams.minimumWage}
        onChange={handlePolicyChange("minimumWage")}
        error={!!formErrors.minimumWage}
        helpText="Legal wage floor. Firms cannot offer wages below this value."
      />

      {/* Global Personal Income Tax brackets */}
      <PersonalIncomeTaxBracket
        personalIncomeTax={policyParams.personalIncomeTax}
        formErrors={formErrors}
        handlePersonalIncomeTaxChange={handlePersonalIncomeTaxChange}
        addPersonalIncomeTaxBracket={addPersonalIncomeTaxBracket}
        removePersonalIncomeTaxBracket={removePersonalIncomeTaxBracket}
      />
    </>
  );

  // --- Advanced content: per-industry + per-demographic overrides ---

  const industrySelector = (
    <ParameterMenuInput
      label="Select Industry to customize"
      value={selectedIndustry}
      onChange={handleSelectedIndustryChange}
      xs={12}
      helpText="Choose which industry you are editing in the overrides below."
    >
      {industryValues.map((value) => (
        <MenuItem key={value} value={value}>
          <span>{value}</span>
        </MenuItem>
      ))}
    </ParameterMenuInput>
  );

  const demographicSelector = (
    <ParameterMenuInput
      label="Select Demographic to customize"
      value={selectedDemographic}
      onChange={handleSelectedDemographicChange}
      xs={12}
      helpText="Choose which demographic you are editing in the overrides below."
    >
      {demographicValues.map((value) => (
        <MenuItem key={value} value={value}>
          <span>{value}</span>
        </MenuItem>
      ))}
    </ParameterMenuInput>
  );

  const advancedContent = (
    <>
      {/* Per-industry overrides */}
      {industrySelector}

      <ParameterSliderInput
        label={`Sales Tax (%) — ${selectedIndustry}`}
        value={
          policyParams.salesTaxByIndustry?.[selectedIndustry] ??
          policyParams.salesTax
        }
        onChange={getIndustryOnChange("salesTaxByIndustry")}
        helpText="Override the global sales tax for this industry."
      />

      <ParameterSliderInput
        label={`Corporate Income Tax (%) — ${selectedIndustry}`}
        value={
          policyParams.corporateTaxByIndustry?.[selectedIndustry] ??
          policyParams.corporateTax
        }
        onChange={getIndustryOnChange("corporateTaxByIndustry")}
        helpText="Override the global corporate tax for this industry."
      />

      <ParameterSliderInput
        label={`Tariffs (%) — ${selectedIndustry}`}
        value={
          policyParams.tariffsByIndustry?.[selectedIndustry] ??
          policyParams.tariffs
        }
        onChange={getIndustryOnChange("tariffsByIndustry")}
        helpText="Override tariffs affecting this industry."
      />

      <ParameterSliderInput
        label={`Subsidies (%) — ${selectedIndustry}`}
        value={
          policyParams.subsidiesByIndustry?.[selectedIndustry] ??
          policyParams.subsidies
        }
        onChange={getIndustryOnChange("subsidiesByIndustry")}
        helpText="Override subsidies paid to this industry."
      />

      {/* Per-industry price cap with its own enable toggle */}
      <ToggleableSliderInput
        label={`Price Cap (%/year) — ${selectedIndustry}`}
        value={
          policyParams.priceCapByIndustry?.[selectedIndustry] ??
          policyParams.priceCap
        }
        isEnabled={
          policyParams.priceCapEnabledByIndustry?.[selectedIndustry] ??
          policyParams.priceCapEnabled
        }
        setIsEnabled={
          typeof handleIndustryPolicyChange === "function"
            ? handleIndustryPolicyChange(
                "priceCapEnabledByIndustry",
                selectedIndustry
              )
            : undefined
        }
        onChange={getIndustryOnChange("priceCapByIndustry")}
        helpText="Override and toggle the global price cap (annual %) for this industry."
      />

      {/* Per-demographic overrides: Personal Income Tax */}
      {demographicSelector}

      <PersonalIncomeTaxBracket
        personalIncomeTax={
          policyParams.personalIncomeTaxByDemographic?.[selectedDemographic] ??
          []
        }
        formErrors={formErrors}
        handlePersonalIncomeTaxChange={getDemoBracketChangeHandler}
        addPersonalIncomeTaxBracket={addDemoBracket}
        removePersonalIncomeTaxBracket={removeDemoBracket}
      />
    </>
  );

  return (
    <ParameterAccordion
      title={
        starting === true
          ? "Starting Government Policies"
          : "Government Policies"
      }
      advancedTitle="Advanced Policy Settings"
      advancedContent={advancedContent}
      defaultAdvancedOpen={false}
    >
      {coreFields}
    </ParameterAccordion>
  );
}
