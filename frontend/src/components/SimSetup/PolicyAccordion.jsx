import ParameterNumInput from "../inputs/ParameterNumInput.jsx";
import ParameterSliderInput from "../inputs/ParameterSliderInput.jsx";
import ParameterAccordion from "./ParameterAccordion.jsx";
import PersonalIncomeTaxBracket from "./PersonalIncomeTaxBracket.jsx";

/**
 * Policy section:
 * - Highlights invalid scalar fields via `formErrors` flags.
 * - (Per-industry overrides omitted; add similar flags if you enable those inputs.)
 */
export default function PolicyAccordion({
  policyParams,
  handlePolicyChange,
  formErrors = {},
  starting = true,
  handlePersonalIncomeTaxChange,
  addPersonalIncomeTaxBracket,
  removePersonalIncomeTaxBracket,
}) {
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

      <ParameterSliderInput
        label="Price Cap (%/year)"
        value={policyParams.priceCap}
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

      <PersonalIncomeTaxBracket
        personalIncomeTax={policyParams.personalIncomeTax}
        formErrors={formErrors}
        handlePersonalIncomeTaxChange={handlePersonalIncomeTaxChange}
        addPersonalIncomeTaxBracket={addPersonalIncomeTaxBracket}
        removePersonalIncomeTaxBracket={removePersonalIncomeTaxBracket}
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
      advancedContent={null}
    >
      {coreFields}
    </ParameterAccordion>
  );
}
