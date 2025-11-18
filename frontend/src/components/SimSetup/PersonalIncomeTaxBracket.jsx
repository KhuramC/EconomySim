import { Button, Box, IconButton, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ParameterNumInput from "./ParameterNumInput.jsx";

export default function PersonalIncomeTaxBracket({
  personalIncomeTax,
  formErrors = {},
  handlePersonalIncomeTaxChange,
  addPersonalIncomeTaxBracket,
  removePersonalIncomeTaxBracket,
}) {
  return (
    <Box sx={{ mt: 2, mb: 1 }}>
      <Typography variant="subtitle1" gutterBottom>
        Personal Income Tax Brackets
      </Typography>
      {personalIncomeTax.map((bracket, index) => (
        <Box
          key={index}
          sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}
        >
          <ParameterNumInput
            label={`Bracket ${index + 1} Threshold ($/year)`}
            value={bracket.threshold}
            onChange={handlePersonalIncomeTaxChange(index, "threshold")}
            error={!!formErrors.personalIncomeTax?.[index]?.threshold}
            helpText="The annual salary threshold to which the corresponding tax rate applies."
          />
          <ParameterNumInput
            label="Rate (%/year)"
            value={bracket.rate}
            onChange={handlePersonalIncomeTaxChange(index, "rate")}
            error={!!formErrors.personalIncomeTax?.[index]?.rate}
            helpText="The annual rate of tax applied to the income above the corresponding threshold."
          />
          <IconButton
            onClick={() => removePersonalIncomeTaxBracket(index)}
            aria-label="delete bracket"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}
      <Button onClick={addPersonalIncomeTaxBracket} variant="outlined">
        Add Tax Bracket
      </Button>
    </Box>
  );
}
