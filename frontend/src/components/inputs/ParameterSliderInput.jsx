import {
  Grid,
  Typography,
  Slider,
  Input,
  Tooltip,
  Box,
  Stack,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

/**
 * A composite input component that combines a slider with a numerical input field.
 *
 * It displays a label, an optional help tooltip, a slider for quick selection, and a precise
 * numerical input field. The value is synchronized between the slider and the input.
 */
const ParameterSliderInput = ({
  label,
  value,
  onChange,
  error = false,
  readOnly = false,
  min = 0,
  max = 100,
  step = 1,
  helpText,
  xs = 6,
  unit = "%",
}) => {
  const handleSliderChange = (event, newValue) => {
    onChange({ target: { value: newValue } });
  };

  const handleInputChange = (event) => {
    const val = event.target.value === "" ? "" : Number(event.target.value);
    onChange({ target: { value: val } });
  };

  const handleInputBlur = () => {
    let val = value;

    // Clamp value between min and max when user leaves the input
    if (typeof val === "number") {
      if (val < min) val = min;
      if (val > max) val = max;
      onChange({ target: { value: val } });
    } else if (val === "") {
      // set to min if empty
      onChange({ target: { value: min } });
    }
  };

  return (
    <Grid size={{ xs: xs }}>
      {/* Label Row */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {helpText && (
          <Tooltip title={helpText} arrow enterDelay={300}>
            <HelpOutlineIcon
              fontSize="small"
              sx={{ ml: 0.5, opacity: 0.7, cursor: "help", fontSize: "1rem" }}
            />
          </Tooltip>
        )}
      </Box>

      {/* Ensure Slider/Input are on same row */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ width: "100%" }}
      >
        <Slider
          value={value}
          onChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          disabled={readOnly}
          sx={{
            flexGrow: 1,
            minWidth: 0,
            ...(error && {
              // Change slider color on error
              color: "error.main",
              "& .MuiSlider-thumb": {
                borderColor: "error.main",
              },
              "& .MuiSlider-track": {
                backgroundColor: "error.main",
              },
              "& .MuiSlider-rail": {
                backgroundColor: "error.light",
              },
            }),
          }}
        />
        <Input
          value={value}
          size="small"
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={readOnly}
          endAdornment={
            unit && <Typography variant="caption">{unit}</Typography>
          }
          inputProps={{ step, min, max, type: "number" }}
          error={error}
          sx={{ width: 120 }}
        />
      </Stack>
    </Grid>
  );
};

export default ParameterSliderInput;
