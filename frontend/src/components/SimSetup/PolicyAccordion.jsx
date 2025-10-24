import ParameterNumInput from "./ParameterNumInput.jsx";
import ParameterAccordion from "./ParameterAccordion.jsx";

export default function PolicyAccordion({
  policyParams,
  handlePolicyChange,
  formErrors,
}) {
  return (
    <ParameterAccordion title="Starting Government Policies">
      <ParameterNumInput
        label="Sales Tax (%)"
        value={policyParams.salesTax}
        onChange={handlePolicyChange("salesTax")}
      />
      <ParameterNumInput
        label="Corporate Income Tax (%)"
        value={policyParams.corporateTax}
        onChange={handlePolicyChange("corporateTax")}
      />
      <ParameterNumInput
        label="Personal Income Tax (%)"
        value={policyParams.personalIncomeTax}
        onChange={handlePolicyChange("personalIncomeTax")}
      />
      <ParameterNumInput
        label="Property Tax (%)"
        value={policyParams.propertyTax}
        onChange={handlePolicyChange("propertyTax")}
      />
      <ParameterNumInput
        label="Tariffs (%)"
        value={policyParams.tariffs}
        onChange={handlePolicyChange("tariffs")}
      />
      <ParameterNumInput
        label="Subsidies (%)"
        value={policyParams.subsidies}
        onChange={handlePolicyChange("subsidies")}
      />
      <ParameterNumInput
        label="Rent Cap ($)"
        value={policyParams.rentCap}
        onChange={handlePolicyChange("rentCap")}
      />
      <ParameterNumInput
        label="Minimum Wage ($/hr)"
        value={policyParams.minimumWage}
        onChange={handlePolicyChange("minimumWage")}
      />
    </ParameterAccordion>
  );
}
