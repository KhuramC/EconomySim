import ParameterNumInput from "./ParameterNumInput.jsx";
import ParameterAccordion from "./ParameterAccordion.jsx";

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
}) {
  const coreFields = (
    <>
      <ParameterNumInput
        label="Sales Tax (%)"
        value={policyParams.salesTax}
        onChange={handlePolicyChange("salesTax")}
        error={!!formErrors.salesTax}
      />
      <ParameterNumInput
        label="Corporate Income Tax (%)"
        value={policyParams.corporateTax}
        onChange={handlePolicyChange("corporateTax")}
        error={!!formErrors.corporateTax}
      />
      <ParameterNumInput
        label="Personal Income Tax (%)"
        value={policyParams.personalIncomeTax}
        onChange={handlePolicyChange("personalIncomeTax")}
        error={!!formErrors.personalIncomeTax}
      />
      <ParameterNumInput
        label="Property Tax (%)"
        value={policyParams.propertyTax}
        onChange={handlePolicyChange("propertyTax")}
        error={!!formErrors.propertyTax}
      />
      <ParameterNumInput
        label="Minimum Wage ($/hr)"
        value={policyParams.minimumWage}
        onChange={handlePolicyChange("minimumWage")}
        error={!!formErrors.minimumWage}
      />
      <ParameterNumInput
        label="Tariffs (%)"
        value={policyParams.tariffs}
        onChange={handlePolicyChange("tariffs")}
        error={!!formErrors.tariffs}
      />
      <ParameterNumInput
        label="Subsidies (%)"
        value={policyParams.subsidies}
        onChange={handlePolicyChange("subsidies")}
        error={!!formErrors.subsidies}
      />
      <ParameterNumInput
        label="Rent Cap ($)"
        value={policyParams.rentCap}
        onChange={handlePolicyChange("rentCap")}
        error={!!formErrors.rentCap}
      />
    </>
  );

  return (
    <ParameterAccordion
      title={starting === true ? "Starting Government Policies" : "Government Policies"}
      advancedContent={null}
    >
      {coreFields}
    </ParameterAccordion>
  );
}
