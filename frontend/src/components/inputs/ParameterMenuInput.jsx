import ParameterInput from "./ParameterInput";

/**
 * A dropdown menu (select) component built on top of `ParameterInput`.
 *
 * This component configures the underlying `ParameterInput` with the `select` prop.
 * It is designed to be used with `MenuItem` components passed as children to populate the dropdown options.
 * It supports a `helpText` prop to display a tooltip next to the label for additional information.
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
