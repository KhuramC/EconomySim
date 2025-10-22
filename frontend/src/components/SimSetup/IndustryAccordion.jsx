import { useState } from "react";
import { MenuItem } from "@mui/material";
import ParameterMenuInput from "./ParameterMenuInput.jsx";
import ParameterNumInput from "./ParameterNumInput.jsx";
import ParameterAccordion from "./ParameterAccordion.jsx";
import { IndustryType } from "../../types/IndustryType.js";

export default function IndustryAccordion({
  industryParams,
  handleIndustryChange,
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
        label="Starting Inventory"
        value={industryParams[selectedIndustry].startingInventory}
        onChange={handleIndustryChange(selectedIndustry, "startingInventory")}
      />
      <ParameterNumInput
        label="Starting Price ($)"
        value={industryParams[selectedIndustry].startingPrice}
        onChange={handleIndustryChange(selectedIndustry, "startingPrice")}
      />
      <ParameterNumInput
        label="Industry Savings ($)"
        value={industryParams[selectedIndustry].industrySavings}
        onChange={handleIndustryChange(selectedIndustry, "industrySavings")}
      />
      <ParameterNumInput
        label="Number of Employees"
        value={industryParams[selectedIndustry].employees}
        onChange={handleIndustryChange(selectedIndustry, "employees")}
      />
      <ParameterNumInput
        label="Offered Wage ($/hr)"
        value={industryParams[selectedIndustry].offeredWage}
        onChange={handleIndustryChange(selectedIndustry, "offeredWage")}
      />
    </ParameterAccordion>
  );
}
