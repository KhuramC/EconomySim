import { Grid, TextField } from "@mui/material";

/**
 * Base input wrapper:
 * - Wraps MUI TextField inside a Grid item with a configurable column span.
 * - Pass `select` to turn it into a dropdown.
 * - Accepts any TextField props via rest spread, including `helperText`.
 */
const ParameterInput = ({
  label,
  value,
  onChange,
  xs = 6,
  fullWidth = true,
  error = false,
  children,
  ...TextFieldProps
}) => {
  return (
    <Grid item xs={xs}>
      <TextField
        label={label}
        value={value}
        onChange={onChange}
        fullWidth={fullWidth}
        error={error}
        {...TextFieldProps}
      >
        {children}
      </TextField>
    </Grid>
  );
};

export default ParameterInput;
