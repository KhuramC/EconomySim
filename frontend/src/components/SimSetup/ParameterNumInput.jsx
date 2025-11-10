import ParameterInput from "./ParameterInput";
import { deepmerge } from "@mui/utils";
import { InputAdornment, Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

/**
 * Number input wrapper:
 * - Uses TextField `type="number"`.
 * - Shows a "?" tooltip as an end adornment (inside the input) so hover always works.
 * - Supports `readOnly` via slotProps (without disabling the visual).
 */
const ParameterNumInput = ({
  label,
  value,
  onChange,
  xs = 6,　// Can still override grid size
  error = false,
  readOnly = false,
  helpText,            // tooltip content
  slotProps,
  inputProps,
  InputProps,          // allow callers to pass their own adornments if needed
  ...otherProps
}) => {
  const internalSlotProps = readOnly ? { input: { readOnly: true } } : {};

  // Build an end adornment tooltip icon when helpText is provided
  const endAdornment = helpText ? (
    <InputAdornment position="end">
      <Tooltip title={helpText} arrow enterDelay={300}>
        <HelpOutlineIcon sx={{ cursor: "help", opacity: 0.7 }} />
      </Tooltip>
    </InputAdornment>
  ) : undefined;

  // Merge caller-provided InputProps (if any) with our adornment
  const mergedInputPropsForBase = {
    ...(InputProps || {}),
    endAdornment: (InputProps && InputProps.endAdornment) || endAdornment,
  };

  return (
    <ParameterInput
      label={label}
      value={value}
      onChange={onChange}
      type="number"
      xs={xs}
      error={error}
      // IMPORTANT: Do NOT pass helpText down, to avoid a duplicate label icon.
      // The tooltip is shown via endAdornment instead.
      helpText={undefined}
      slotProps={deepmerge(internalSlotProps, slotProps)}
      inputProps={{ step: "any", ...(inputProps || {}) }}
      InputProps={mergedInputPropsForBase}
      {...otherProps}
    />
  );
};

export default ParameterNumInput;
