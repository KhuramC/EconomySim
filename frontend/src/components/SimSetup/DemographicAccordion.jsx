import { useState } from "react";
import { MenuItem } from "@mui/material";
import ParameterMenuInput from "./ParameterMenuInput.jsx";
import ParameterNumInput from "./ParameterNumInput.jsx";
import ParameterAccordion from "./ParameterAccordion.jsx";
import { Demographic } from "../../types/Demographic.js";

export default function DemographicAccordion({
  demoParams,
  handleDemographicChange,
  formErrors,
  starting = true,
}) {
  const [selectedDemographic, setSelectedDemographic] = useState(
    Object.values(Demographic)[0]
  );

  // Handler for demographic selector dropdown
  const handleSelectedDemographicChange = (event) => {
    setSelectedDemographic(event.target.value);
  };

  return (
    <ParameterAccordion title="Demographic Parameters">
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
        onChange={handleDemographicChange(selectedDemographic, "proportion")}
        // Display error if 'formErrors.proportion' exists
        error={!!formErrors.proportion}
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
      />
      <ParameterNumInput
        label="Mean Income ($/week)"
        value={demoParams[selectedDemographic].meanIncome}
        onChange={handleDemographicChange(selectedDemographic, "meanIncome")}
      />
      <ParameterNumInput
        label="Income Std. Deviation ($)"
        value={demoParams[selectedDemographic].sdIncome}
        onChange={handleDemographicChange(selectedDemographic, "sdIncome")}
      />
      <ParameterNumInput
        label="Mean Savings ($)"
        value={demoParams[selectedDemographic].meanSavings}
        onChange={handleDemographicChange(selectedDemographic, "meanSavings")}
      />
      <ParameterNumInput
        label="Savings Std. Deviation ($)"
        value={demoParams[selectedDemographic].sdSavings}
        onChange={handleDemographicChange(selectedDemographic, "sdSavings")}
      />
      <ParameterNumInput
        label="Spending Behavior (% Income)"
        value={demoParams[selectedDemographic].spendingBehavior}
        onChange={handleDemographicChange(
          selectedDemographic,
          "spendingBehavior"
        )}
      />
    </ParameterAccordion>
  );
}
