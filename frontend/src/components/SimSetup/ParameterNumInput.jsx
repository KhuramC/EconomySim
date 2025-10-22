import ParameterInput from "./ParameterInput";

const ParameterNumInput = ({
  label,
  value,
  onChange,
  xs = 6, // Can still override grid size
  error = false,
  ...otherProps
}) => {
  return (
    <ParameterInput
      label={label}
      value={value}
      onChange={onChange}
      type="number"
      xs={xs}
      error={error}
      {...otherProps}
    />
  );
};

export default ParameterNumInput;
