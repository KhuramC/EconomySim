// src/components/SimSetup/ParameterInput.jsx
// Generic field used across Setup forms.
// - For MUI v6: use `slotProps` instead of deprecated InputProps/inputProps.
// - When used as a Select, render the help "?" OUTSIDE so it won't overlap the dropdown arrow.

import {
  Grid,
  TextField,
  Tooltip,
  InputAdornment,
  IconButton,
  Box,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

export default function ParameterInput({
  label,
  value,
  onChange,
  xs = 6,
  fullWidth = true,
  error = false,
  helpText,
  type = "text",
  disabled = false,
  readOnly = false,
  nativeInputProps,   // backward-friendly: merged into slotProps.input (v6)
  sx,
  onWheel,
  // Allow callers (e.g., ParameterNumInput) to pass their own slotProps
  slotProps: callerSlotProps,
  ...rest            // may contain `select`, `SelectProps`, etc.
}) {
  const isSelect = !!rest.select;

  // Use endAdornment only for NON-selects to avoid overlap with the dropdown chevron
  const endAdornment =
    !isSelect && helpText ? (
      <InputAdornment position="end" sx={{ pointerEvents: "auto" }}>
        <Tooltip title={helpText} arrow>
          <IconButton size="small" tabIndex={-1} aria-label="Help">
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </InputAdornment>
    ) : null;

  // --- Build default slotProps (label wrapping + readOnly + optional adornment) ---
  const defaultSlotProps = {
    // Prevent long labels from truncating; always keep them visible and shrunk
    inputLabel: {
      shrink: true,
      sx: {
        maxWidth: "calc(100% - 56px)",
        whiteSpace: "normal",
        overflow: "visible",
        textOverflow: "unset",
        lineHeight: 1.1,
      },
    },
    // Props for the underlying input element (MUI v6)
    input: {
      readOnly,
      ...(endAdornment ? { endAdornment } : {}),
    },
  };

  // Merge strategy:
  // - Start from defaults
  // - Spread in caller slotProps (so caller can override)
  // - Merge nested input/inputLabel shallowly
  const mergedSlotProps = {
    ...defaultSlotProps,
    ...(callerSlotProps || {}),
    inputLabel: {
      ...(defaultSlotProps.inputLabel || {}),
      ...(callerSlotProps?.inputLabel || {}),
    },
    input: {
      ...(defaultSlotProps.input || {}),
      ...(callerSlotProps?.input || {}),
      // Merge any legacy-style native input props (min, max, inputMode, step, etc.)
      ...(nativeInputProps || {}),
    },
  };

  const field = (
    <TextField
      variant="outlined"
      fullWidth={fullWidth}
      label={label}
      value={value}
      onChange={onChange}
      error={error}
      type={type}
      disabled={disabled}
      slotProps={mergedSlotProps}
      onWheel={onWheel}
      sx={sx}
      {...rest}
    />
  );

  // For selects with help text, place the "?" button outside to the right
  if (isSelect && helpText) {
    return (
      <Grid item xs={xs}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {field}
          <Tooltip title={helpText} arrow>
            <IconButton size="small" aria-label="Help">
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Grid>
    );
  }

  // Default: render the field in a grid cell
  return <Grid item xs={xs}>{field}</Grid>;
}
