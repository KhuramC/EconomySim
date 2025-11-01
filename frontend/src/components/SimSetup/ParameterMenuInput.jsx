import ParameterInput from "./ParameterInput";

/**
 * Dropdown (Select) input wrapper built on top of ParameterInput.
 */
const ParameterMenuInput = ({
  label,
  value,
  onChange,
  xs = 12,
  error = false,
  children,
  ...otherProps
}) => {
  return (
    <ParameterInput
      label={label}
      value={value}
      onChange={onChange}
      select
      xs={xs}
      error={error}
      {...otherProps}
    >
      {children}
    </ParameterInput>
  );
};

export default ParameterMenuInput;
