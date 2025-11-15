import ParameterInput from "./ParameterInput.jsx";

/**
 * Numeric input that supports spinner + free typing.
 * - Keeps a controlled string so partial values are allowed ("", "-", "1.", ".5").
 * - Uses native <input type="number"> for spinner & mobile numeric keypad.
 * - Parsing/validation is deferred to the caller/builder.
 */
export default function ParameterNumInput({
  label,
  value,
  onChange,
  onBlur,              // forwarded so parent can force a flush on blur
  xs = 6,
  fullWidth = true,
  error = false,
  helpText,
  readOnly = false,
  min,
  max,
  ...rest
}) {
  return (
    <ParameterInput
      label={label}
      value={value ?? ""}           // keep typing-friendly controlled value
      onChange={onChange}
      onBlur={onBlur}
      xs={xs}
      fullWidth={fullWidth}
      error={error}
      helpText={helpText}
      type="number"
      // These go to the native <input>; ParameterInput maps to slotProps.input.inputProps
      nativeInputProps={{
        inputMode: "decimal",
        step: "any",
        ...(min !== undefined ? { min } : {}),
        ...(max !== undefined ? { max } : {}),
        readOnly,
      }}
      // Prevent wheel from changing value unintentionally while focused
      onWheel={(e) => e.currentTarget.blur()}
      {...rest}
    />
  );
}
