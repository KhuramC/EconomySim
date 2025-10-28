import ParameterInput from "./ParameterInput";
import { deepmerge } from "@mui/utils";

const ParameterNumInput = ({
  label,
  value,
  onChange,
  xs = 6, // Can still override grid size
  error = false,
  readOnly = false,
  slotProps,
  ...otherProps
}) => {
  const internalSlotProps = readOnly
    ? {
        input: {
          readOnly: true,
        },
      }
    : {};

  return (
    <ParameterInput
      label={label}
      value={value}
      onChange={onChange}
      type="number"
      xs={xs}
      error={error}
      slotProps={deepmerge(internalSlotProps, slotProps)}
      {...otherProps}
    />
  );
};

export default ParameterNumInput;
