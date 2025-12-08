import { Grid, FormControlLabel, Switch, Tooltip } from "@mui/material";

/**
 * A toggle switch input component for boolean parameters.
 *
 * This component wraps a Material-UI `Switch` inside a `FormControlLabel` for a
 * clean layout. It's designed for handling boolean (on/off) values.
 * A tooltip can be added to the label by providing the `helpText` prop.
 */
const ParameterToggleInput = ({ label, value, onChange, helpText, xs = 6 }) => {
  const labelNode = helpText ? (
    <Tooltip title={helpText} arrow>
      <span>{label}</span>
    </Tooltip>
  ) : (
    label
  );

  return (
    <Grid size={{ xs: xs }}>
      <FormControlLabel
        control={<Switch checked={!!value} onChange={onChange} />}
        label={labelNode}
      />
    </Grid>
  );
};

export default ParameterToggleInput;
