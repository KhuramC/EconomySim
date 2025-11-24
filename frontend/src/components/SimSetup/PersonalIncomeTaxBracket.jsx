import { Button, IconButton, Typography, Grid, Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ParameterNumInput from "../inputs/ParameterNumInput.jsx";
import ParameterSliderInput from "../inputs/ParameterSliderInput.jsx";

export default function PersonalIncomeTaxBracket({
  personalIncomeTax,
  formErrors = {},
  handlePersonalIncomeTaxChange,
  addPersonalIncomeTaxBracket,
  removePersonalIncomeTaxBracket,
}) {
  return (
    <Grid
      container
      spacing={2}
      sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}
    >
      <Typography variant="subtitle1" gutterBottom>
        Personal Income Tax Brackets
      </Typography>
      {personalIncomeTax.map((bracket, index) => (
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          key={index}
          sx={{ width: "100%" }}
        >
          <ParameterNumInput
            label={`Bracket ${index + 1} Threshold ($/year)`}
            value={bracket.threshold}
            onChange={handlePersonalIncomeTaxChange(index, "threshold")}
            error={!!formErrors.personalIncomeTax?.[index]?.threshold}
            helpText="The annual salary threshold to which the corresponding tax rate applies."
            xs={5}
          />
          <ParameterSliderInput
            label="Rate (%/year)"
            value={bracket.rate}
            onChange={handlePersonalIncomeTaxChange(index, "rate")}
            error={!!formErrors.personalIncomeTax?.[index]?.rate}
            helpText="The annual rate of tax applied to the income above the corresponding threshold."
          />
          <Grid size={{ xs: 1 }}>
            <IconButton
              onClick={() => removePersonalIncomeTaxBracket(index)}
              aria-label="delete bracket"
            >
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Stack>
      ))}
      <Button onClick={addPersonalIncomeTaxBracket} variant="outlined">
        Add Tax Bracket
      </Button>
    </Grid>
  );
}
