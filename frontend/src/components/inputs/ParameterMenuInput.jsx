import ParameterInput from "./ParameterInput";

/**
 * Dropdown (Select) input wrapper built on top of ParameterInput.
 * - Use with <MenuItem> children.
 * - Supports `helpText` for a tooltip next to the label.
 */
const ParameterMenuInput = ({
  label,
  value,
  onChange,
  xs = 12,
  error = false,
  helpText, // tooltip content
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
      helpText={helpText}
      {...otherProps}
    >
      {children}
    </ParameterInput>
  );
};

export default ParameterMenuInput;
