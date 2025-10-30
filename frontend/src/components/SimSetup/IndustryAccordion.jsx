import { useState } from "react";
import { MenuItem } from "@mui/material";
import ParameterMenuInput from "./ParameterMenuInput.jsx";
import ParameterNumInput from "./ParameterNumInput.jsx";
import ParameterAccordion from "./ParameterAccordion.jsx";
import { IndustryType } from "../../types/IndustryType.js";

export default function IndustryAccordion({
  industryParams,
  handleIndustryChange,
  formErrors,
  starting = true,
  readOnly = false,
}) {
  const [selectedIndustry, setSelectedIndustry] = useState(
    Object.values(IndustryType)[0]
  );

  // Handler for industry selector dropdown
  const handleSelectedIndustryChange = (event) => {
    setSelectedIndustry(event.target.value);
  };

  return (
    <ParameterAccordion title="Industry Parameters">
      <ParameterMenuInput
        label="Industry"
        value={selectedIndustry}
        onChange={handleSelectedIndustryChange}
        xs={12}
      >
        {Object.entries(IndustryType).map(([key, value]) => (
          // Create a MenuItem for each IndustryType
          <MenuItem key={value} value={value}>
            <span style={{ textTransform: "capitalize" }}>{value}</span>
          </MenuItem>
        ))}
      </ParameterMenuInput>
      <ParameterNumInput
        label={starting == true ? "Starting Inventory" : "Inventory"}
        value={industryParams[selectedIndustry].startingInventory}
        onChange={handleIndustryChange(selectedIndustry, "startingInventory")}
        readOnly={readOnly}
      />
      <ParameterNumInput
        label={starting == true ? "Starting Price ($)" : "Price ($)"}
        value={industryParams[selectedIndustry].startingPrice}
        onChange={handleIndustryChange(selectedIndustry, "startingPrice")}
        readOnly={readOnly}
      />
      <ParameterNumInput
        label={starting == true ? "Industry Savings ($)" : "Savings ($)"}
        value={industryParams[selectedIndustry].industrySavings}
        onChange={handleIndustryChange(selectedIndustry, "industrySavings")}
        readOnly={readOnly}
      />
      <ParameterNumInput
        label={starting == true ? "Offered Wage ($/hr)" : "Wage ($/hr)"}
        value={industryParams[selectedIndustry].offeredWage}
        onChange={handleIndustryChange(selectedIndustry, "offeredWage")}
        readOnly={readOnly}
      />
    </ParameterAccordion>
  );
}
