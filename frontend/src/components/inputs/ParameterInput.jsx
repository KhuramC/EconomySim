import { Grid, TextField, Tooltip, Box } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { deepmerge } from "@mui/utils";

/**
 * A base input component that wraps a Material-UI TextField within a Grid item.
 * It provides a consistent layout for form parameters and adds features like a help tooltip.
 *
 * To use this as a dropdown menu, see ParameterMenuInput.
 * To use this as a number input, see ParameterNumInput.
 */
const ParameterInput = ({
  label,
  value,
  onChange,
  xs = 6,
  fullWidth = true,
  error = false,
  helpText, // tooltip content shown beside the label (for select/text)
  children,
  slotProps,
  readOnly = false,
  ...TextFieldProps
}) => {
  // Compose a label node that includes a tooltip icon when `helpText` is provided
  const labelNode = helpText ? (
    <Box
      component="span"
      sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
    >
      <span>{label}</span>
      <Tooltip title={helpText} arrow enterDelay={300}>
        <HelpOutlineIcon
          fontSize="inherit"
          sx={{ opacity: 0.7, cursor: "help" }}
          aria-label={
            typeof label === "string" ? `${label} help` : "Field help"
          }
          onMouseDown={(e) => e.preventDefault()}
        />
      </Tooltip>
    </Box>
  ) : (
    label
  );

  // Ensure the InputLabel can receive pointer events so the tooltip works.
  // NOTE: pointer events on InputLabel are enabled when shrink=true,
  // so we force shrink to true for consistent behavior.
  const baseSlotProps = {
    inputLabel: {
      shrink: true,
      sx: {
        pointerEvents: "auto",
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        "& .MuiSvgIcon-root": { verticalAlign: "middle" },
      },
    },
  };

  // Merge any caller-provided slotProps (keeps other slots like `input` intact)
  const mergedSlotProps = deepmerge(baseSlotProps, slotProps || {});

  return (
    <Grid size={{ xs: xs }}>
      <TextField
        label={labelNode}
        value={value}
        onChange={onChange}
        fullWidth={fullWidth}
        error={error}
        slotProps={mergedSlotProps}
        disabled={readOnly}
        {...TextFieldProps}
      >
        {children}
      </TextField>
    </Grid>
  );
};

export default ParameterInput;
