import { Switch, FormControlLabel } from "@mui/material";
import ParameterNumInput from "./ParameterNumInput.jsx";
import ParameterAccordion from "./ParameterAccordion.jsx";

/**
 * Environmental section:
 * - Core: Max Simulation Length, Total People
 * - Advanced: National Inflation Rate, Random Events
 */
export default function EnvironmentalAccordion({
  envParams,
  handleEnvChange,
  formErrors,
}) {
  const coreFields = (
    <>
      <ParameterNumInput
        label="Max Simulation Length (weeks)"
        value={envParams.maxSimulationLength}
        onChange={handleEnvChange("maxSimulationLength")}
      />
      <ParameterNumInput
        label="Total People"
        value={envParams.numPeople}
        onChange={handleEnvChange("numPeople")}
      />
    </>
  );

  const advancedFields = (
    <>
      <ParameterNumInput
        label="National Inflation Rate (%/week)"
        value={envParams.inflationRate}
        onChange={handleEnvChange("inflationRate")}
      />

      <FormControlLabel
        control={
          <Switch
            checked={envParams.randomEvents}
            onChange={handleEnvChange("randomEvents")}
          />
        }
        label="Random Events"
      />
    </>
  );

  return (
    <ParameterAccordion
      title="Environmental Parameters"
      defaultExpanded
      advancedContent={advancedFields}
      defaultAdvancedOpen={false}
    >
      {coreFields}
    </ParameterAccordion>
  );
}
