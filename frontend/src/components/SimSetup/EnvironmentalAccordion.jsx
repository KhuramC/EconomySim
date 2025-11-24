import ParameterNumInput from "./ParameterNumInput.jsx";
import ParameterSliderInput from "./ParameterSliderInput.jsx";
import ParameterAccordion from "./ParameterAccordion.jsx";

/**
 * Environmental section:
 * - Core: Max Simulation Length, Total People
 * - Advanced: National Inflation Rate, Random Events
 * The advanced block is rendered under a title on a new line.
 * - Each field includes a tooltip explaining its role.
 */
export default function EnvironmentalAccordion({
  envParams,
  handleEnvChange,
  formErrors = {},
}) {
  const coreFields = (
    <>
      <ParameterNumInput
        label="Max Simulation Length (weeks)"
        value={envParams.maxSimulationLength}
        onChange={handleEnvChange("maxSimulationLength")}
        error={!!formErrors.maxSimulationLength}
        helpText="Number of weeks to run the simulation. Longer horizons reveal long-term trends but take more time."
      />
      <ParameterNumInput
        label="Total People"
        value={envParams.numPeople}
        onChange={handleEnvChange("numPeople")}
        error={!!formErrors.numPeople}
        helpText="Number of person agents created. Larger populations better approximate aggregates but use more CPU."
      />
    </>
  );

  const advancedFields = (
    <>
      <ParameterSliderInput
        label="National Inflation Rate (%/year)"
        value={envParams.inflationRate}
        onChange={handleEnvChange("inflationRate")}
        helpText="Baseline annual inflation rate. Prices tend to drift upward by this percentage each year."
        unit="%"
      />
    </>
  );

  return (
    <ParameterAccordion
      title="Environmental Parameters"
      defaultExpanded
      advancedTitle="Advanced Environmental Settings"
      advancedContent={advancedFields}
      defaultAdvancedOpen={false}
    >
      {coreFields}
    </ParameterAccordion>
  );
}
