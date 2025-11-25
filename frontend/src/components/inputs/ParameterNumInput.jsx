import ParameterInput from "./ParameterInput";
import { InputAdornment, Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { deepmerge } from "@mui/utils";

/**
 * Number input wrapper:
 * - Uses TextField `type="number"`.
 * - Shows a "?" tooltip as an end adornment (inside the input) so hover always works.
 */
const ParameterNumInput = ({
  label,
  value,
  onChange,
  xs = 6, // Can still override grid size
  error = false,
  readOnly = false,
  helpText, // tooltip content
  slotProps,
  ...otherProps
}) => {
  // Build an end adornment tooltip icon when helpText is provided
  const endAdornment = helpText ? (
    <InputAdornment position="end">
      <Tooltip title={helpText} arrow enterDelay={300}>
        <HelpOutlineIcon sx={{ cursor: "help", opacity: 0.7 }} />
      </Tooltip>
    </InputAdornment>
  ) : undefined;

  const baseSlotProps = {
    input: {
      endAdornment: endAdornment,
    },
  };
  const mergedSlotProps = deepmerge(baseSlotProps, slotProps || {});

  return (
    <ParameterInput
      label={label}
      value={value}
      onChange={onChange}
      type="number"
      xs={xs}
      error={error}
      helpText={null} 
      // helpText is not sent down since it's shown in the adornment in mergedSlotProps
      readOnly={readOnly}
      slotProps={mergedSlotProps}
      {...otherProps}
    />
  );
};

export default ParameterNumInput;
