import { Grid, Switch, FormControlLabel } from "@mui/material";
import ParameterNumInput from "./ParameterNumInput.jsx";
import ParameterAccordion from "./ParameterAccordion.jsx";

/**
 * Environmental section:
 * - Red highlights are controlled via `formErrors` flags from SetupPage.
 *  * - Advanced: National Inflation Rate, Random Events
 * The advanced block is rendered under a title on a new line.
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
      />
      <ParameterNumInput
        label="Total People"
        value={envParams.numPeople}
        onChange={handleEnvChange("numPeople")}
        error={!!formErrors.numPeople}
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
      {/* Wrap the switch in a Grid item to keep layout consistent */}
      <Grid item xs={6}>
        <FormControlLabel
          control={
            <Switch
              checked={envParams.randomEvents}
              onChange={handleEnvChange("randomEvents")}
            />
          }
          label="Random Events"
        />
      </Grid>
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
