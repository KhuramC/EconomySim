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
  readOnly = false,
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
        onChange={handleDemographicChange(selectedDemographic, "meanIncome")}
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
        onChange={handleDemographicChange(selectedDemographic, "meanSavings")}
        readOnly={readOnly}
      />
      <ParameterNumInput
        label="Savings Std. Deviation ($)"
        value={demoParams[selectedDemographic].sdSavings}
        onChange={handleDemographicChange(selectedDemographic, "sdSavings")}
        readOnly={readOnly}
      />
      <ParameterNumInput
        label="Spending Behavior (% Income)"
        value={demoParams[selectedDemographic].spendingBehavior}
        onChange={handleDemographicChange(
          selectedDemographic,
          "spendingBehavior"
        )}
        readOnly={readOnly}
      />
    </ParameterAccordion>
  );
}
