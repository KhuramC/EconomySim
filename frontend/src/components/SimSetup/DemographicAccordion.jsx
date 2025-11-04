import { useState } from "react";
import {
  MenuItem,
  Box,
  Divider,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import ParameterMenuInput from "./ParameterMenuInput.jsx";
import ParameterNumInput from "./ParameterNumInput.jsx";
import ParameterAccordion from "./ParameterAccordion.jsx";
import { Demographic } from "../../types/Demographic.js";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { IndustryType } from "../../types/IndustryType.js";

export default function DemographicAccordion({
  demoParams,
  handleDemographicChange,
  formErrors,
  starting = true,
  readOnly = false,
}) {
  const [selectedDemographic, setSelectedDemographic] = useState(
    Object.values(Demographic)[0]
  );
  const spendingBehaviorOptions = IndustryType;

  // Handler for demographic selector dropdown
  const handleSelectedDemographicChange = (event) => {
    setSelectedDemographic(event.target.value);
  };

  console.log("Demo Params in DemographicAccordion:", demoParams);
  console.log(
    "grociers for lowerclass demo params",
    demoParams["lower class"].GROCERIES
  );

  return (
    <Accordion defaultExpanded={false}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">Demographic Parameters</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          <ParameterMenuInput
            label="Demographic"
            value={selectedDemographic}
            onChange={handleSelectedDemographicChange}
            xs={12}
          >
            {Object.entries(Demographic).map(([key, value]) => (
              // Create a MenuItem for each Demographic
              <MenuItem key={value} value={value}>
                <span style={{ textTransform: "capitalize" }}>{value}</span>
              </MenuItem>
            ))}
          </ParameterMenuInput>
          <ParameterNumInput
            label="Proportion of Population (%)"
            value={demoParams[selectedDemographic].proportion}
            onChange={handleDemographicChange(
              selectedDemographic,
              "proportion"
            )}
            // Display error if 'formErrors.proportion' exists
            error={!!formErrors.proportion}
            readOnly={readOnly}
          />
          <ParameterNumInput
            label={
              starting == true
                ? "Starting Unemployment Rate (%)"
                : "Unemployment Rate (%)"
            }
            value={demoParams[selectedDemographic].unemploymentRate}
            onChange={handleDemographicChange(
              selectedDemographic,
              "unemploymentRate"
            )}
            readOnly={readOnly}
          />
          <ParameterNumInput
            label="Mean Income ($/week)"
            value={demoParams[selectedDemographic].meanIncome}
            onChange={handleDemographicChange(
              selectedDemographic,
              "meanIncome"
            )}
            readOnly={readOnly}
          />
          <ParameterNumInput
            label="Income Std. Deviation ($)"
            value={demoParams[selectedDemographic].sdIncome}
            onChange={handleDemographicChange(selectedDemographic, "sdIncome")}
            readOnly={readOnly}
          />
          <ParameterNumInput
            label="Mean Savings ($)"
            value={demoParams[selectedDemographic].meanSavings}
            onChange={handleDemographicChange(
              selectedDemographic,
              "meanSavings"
            )}
            readOnly={readOnly}
          />
          <ParameterNumInput
            label="Savings Std. Deviation ($)"
            value={demoParams[selectedDemographic].sdSavings}
            onChange={handleDemographicChange(selectedDemographic, "sdSavings")}
            readOnly={readOnly}
          />
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Spending Behavior (% of income)
        </Typography>
        <Grid container spacing={1}>
          {Object.entries(spendingBehaviorOptions).map(([upperKey, label]) => (
            <Grid
              key={`spendingBehavior-${upperKey}`}
              item
              xs={12}
              sm={6}
              md={4}
            >
              <ParameterNumInput
                label={label}
                value={demoParams[selectedDemographic]?.[upperKey] ?? ""}
                onChange={handleDemographicChange(
                  selectedDemographic,
                  upperKey
                )}
                readOnly={readOnly}
              />
            </Grid>
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}
