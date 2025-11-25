import ParameterInput from "./ParameterInput";
import { InputAdornment, Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { deepmerge } from "@mui/utils";

/**
 * A specialized input component for numerical values, built upon `ParameterInput`.
 *
 * This component configures the underlying `ParameterInput` to be of `type="number"`.
 * It also provides a help tooltip, now inside the input field as an end adornment.
 */
const ParameterNumInput = ({
  label,
  value,
  onChange,
  xs = 6,
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
