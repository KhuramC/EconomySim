import { Grid, TextField } from "@mui/material";

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
