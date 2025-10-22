import { Switch, FormControlLabel } from "@mui/material";
import ParameterNumInput from "./ParameterNumInput.jsx";
import ParameterAccordion from "./ParameterAccordion.jsx";

export default function EnvironmentalAccordion({
  envParams,
  handleEnvChange,
  formErrors,
}) {
  return (
    <ParameterAccordion title="Environmental Parameters" defaultExpanded>
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
    </ParameterAccordion>
  );
}
