import ParameterNumInput from "./ParameterNumInput.jsx";
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
      <ParameterNumInput
        label="Sales Tax (%/year)"
        value={policyParams.salesTax}
        onChange={handlePolicyChange("salesTax")}
        error={!!formErrors.salesTax}
        helpText="Tax applied to consumer purchases. Increases effective prices and can dampen demand."
      />
      <ParameterNumInput
        label="Corporate Income Tax (%/year)"
        value={policyParams.corporateTax}
        onChange={handlePolicyChange("corporateTax")}
        error={!!formErrors.corporateTax}
        helpText="Tax on industry profits. Reduces retained earnings and may affect investment."
      />

      <ParameterNumInput
        label="Property Tax (%/year)"
        value={policyParams.propertyTax}
        onChange={handlePolicyChange("propertyTax")}
        error={!!formErrors.propertyTax}
        helpText="Recurring tax on property values. Can influence housing costs and investment."
      />
      <ParameterNumInput
        label="Minimum Wage ($/hr)"
        value={policyParams.minimumWage}
        onChange={handlePolicyChange("minimumWage")}
        error={!!formErrors.minimumWage}
        helpText="Legal wage floor. Firms cannot offer wages below this value."
      />
      <ParameterNumInput
        label="Tariffs (%)"
        value={policyParams.tariffs}
        onChange={handlePolicyChange("tariffs")}
        error={!!formErrors.tariffs}
        helpText="Import duties that raise costs of targeted goods. Can shift demand across industries."
      />
      <ParameterNumInput
        label="Subsidies (%)"
        value={policyParams.subsidies}
        onChange={handlePolicyChange("subsidies")}
        error={!!formErrors.subsidies}
        helpText="Government support paid to industries. Lowers effective costs or boosts income."
      />
      <ParameterNumInput
        label="Price Cap (%/year)"
        value={policyParams.priceCap}
        onChange={handlePolicyChange("priceCap")}
        error={!!formErrors.priceCap}
        helpText="The percentage above which industries cannot set their prices from the week before. Helps control inflation."
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
