// frontend/src/components/SimSetup/ParameterNumInput.jsx
import ParameterInput from "./ParameterInput.jsx";

/**
 * ParameterNumInput
 * Numeric input that allows BOTH spinner and free typing.
 *
 * UX goals:
 * - Keep a controlled string while typing so partial inputs are valid (e.g., "", "-", "1.", ".5").
 * - Use <input type="number"> so native spinners and numeric keypad are available.
 * - Allow decimals via step="any" and inputMode="decimal".
 * - Defer parsing/validation to the caller (e.g., SetupPage validators).
 *
 * Props:
 * - label: string (TextField label)
 * - value: string|number (kept as-is; empty string is allowed while typing)
 * - onChange: (event) => void (should store raw event.target.value)
 * - xs: grid width (default 6)
 * - fullWidth: boolean (default true)
 * - error: boolean (red error style)
 * - helpText: string (helper text under the field)
 * - readOnly: boolean (prevents editing but still shows value)
 * - min/max: optional numeric constraints for native validation UI
 * - ...rest: forwarded to underlying TextField via ParameterInput
 */
export default function ParameterNumInput({
  label,
  value,
  onChange,
  xs = 6,
  fullWidth = true,
  error = false,
  helpText,
  readOnly = false,
  min,           // optional numeric constraint (native)
  max,           // optional numeric constraint (native)
  ...rest        // any extra TextField props (e.g., disabled, sx, required)
}) {
  return (
    <ParameterInput
      label={label}
      // Keep controlled input friendly to typing; empty string is allowed
      value={value ?? ""}
      onChange={onChange}
      xs={xs}
      fullWidth={fullWidth}
      error={error}
      helpText={helpText}
      // Forward readOnly to the native input element
      InputProps={{ readOnly }}
      // Use native number input for spinners & mobile numeric keypad
      type="number"
      inputProps={{
        inputMode: "decimal", // mobile decimal keypad
        step: "any",          // allow fractional steps (e.g., 0.1, 0.01)
        ...(min !== undefined ? { min } : {}),
        ...(max !== undefined ? { max } : {}),
      }}
      // Avoid accidental wheel-changes when the input has focus
      onWheel={(e) => e.currentTarget.blur()}
      {...rest}
    />
  );
}
