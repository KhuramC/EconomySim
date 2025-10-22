import ParameterInput from "./ParameterInput";

const ParameterNumInput = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  xs = 6, // Can still override grid size
  error = false,
  ...otherProps
}) => {
  const inputSlotProps = {};
  // Only add min, max, step if they are defined
  if (min !== undefined) inputSlotProps.min = min;
  if (max !== undefined) inputSlotProps.max = max;
  if (step !== undefined) inputSlotProps.step = step;

  return (
    <ParameterInput
      label={label}
      value={value}
      onChange={onChange}
      type="number"
      xs={xs}
      error={error}
      slotProps={
        Object.keys(inputSlotProps).length > 0
          ? { input: inputSlotProps }
          : undefined
      }
      {...otherProps}
    />
  );
};

export default ParameterNumInput;
