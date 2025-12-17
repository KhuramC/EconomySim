import { Grid, Stack } from "@mui/material";
import ParameterSliderInput from "./ParameterSliderInput";
import ParameterToggleInput from "./ParameterToggleInput";

/**
 * A composite input component that pairs a slider with a toggle switch to enable or disable it.
 *
 * This component renders a `ParameterSliderInput` alongside a `ParameterToggleInput`.
 * The toggle switch controls the `readOnly` state of the slider, allowing the user
 * to enable or disable the ability to change the slider's value.
 */
const ToggleableSliderInput = ({
  label,
  value,
  isEnabled,
  setIsEnabled,
  onChange,
  error = false,
  min = 0,
  max = 100,
  step = 1,
  helpText,
  xs = 6,
  unit = "%",
}) => {
  const handleToggle = (event) => {
    setIsEnabled(event.target.checked);
  };

  return (
    <Grid size={{ xs: xs }}>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ width: "100%" }}
      >
        <ParameterSliderInput
          label={label}
          value={value}
          onChange={onChange}
          error={error}
          readOnly={!isEnabled}
          min={min}
          max={max}
          step={step}
          helpText={helpText}
          xs={12} // Full width within the Grid item
          unit={unit}
        />

        <ParameterToggleInput
          label={isEnabled ? "Disable" : "Enable"}
          value={isEnabled}
          onChange={handleToggle}
          xs={5}
        />
      </Stack>
    </Grid>
  );
};

export default ToggleableSliderInput;
