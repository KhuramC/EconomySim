import { useMemo, useState } from "react";
import { MenuItem } from "@mui/material";
import ParameterMenuInput from "./ParameterMenuInput.jsx";
import ParameterNumInput from "./ParameterNumInput.jsx";
import ParameterAccordion from "./ParameterAccordion.jsx";
import { IndustryType } from "../../types/IndustryType.js";

/**
 * Industry section:
 * - Highlights invalid fields via `formErrors[selectedIndustry]`.
 * - Core: Industry selector, Starting Price, Offered Wage
 * - Advanced: Starting Inventory, Industry Savings
 */
export default function IndustryAccordion({
  industryParams,
  handleIndustryChange,
  formErrors = {},
  starting = true,
  readOnly = false,
}) {
  const industryValues = useMemo(() => Object.values(IndustryType), []);
  const [selectedIndustry, setSelectedIndustry] = useState(industryValues[0]);

  const handleSelectedIndustryChange = (event) => {
    setSelectedIndustry(event.target.value);
  };

  const current = industryParams[selectedIndustry] || {};
  const err = formErrors[selectedIndustry] || {};

  const coreFields = (
    <>
      <ParameterMenuInput
        label="Industry"
        value={selectedIndustry}
        onChange={handleSelectedIndustryChange}
        xs={12}
      >
        {industryValues.map((value) => (
          <MenuItem key={value} value={value}>
            <span style={{ textTransform: "capitalize" }}>{value}</span>
          </MenuItem>
        ))}
      </ParameterMenuInput>

      <ParameterNumInput
        label={starting === true ? "Starting Price ($)" : "Price ($)"}
        value={current.startingPrice}
        onChange={handleIndustryChange(selectedIndustry, "startingPrice")}
        error={!!err.startingPrice}
        readOnly={readOnly}
      />

      <ParameterNumInput
        label={starting === true ? "Offered Wage ($/hr)" : "Wage ($/hr)"}
        value={current.offeredWage}
        onChange={handleIndustryChange(selectedIndustry, "offeredWage")}
        error={!!err.offeredWage}
        readOnly={readOnly}
      />
    </>
  );

  const advancedFields = (
    <>
      <ParameterNumInput
        label={starting === true ? "Starting Inventory" : "Inventory"}
        value={current.startingInventory}
        onChange={handleIndustryChange(selectedIndustry, "startingInventory")}
        error={!!err.startingInventory}
        readOnly={readOnly}
      />

      <ParameterNumInput
        label={starting === true ? "Industry Savings ($)" : "Savings ($)"}
        value={current.industrySavings}
        onChange={handleIndustryChange(selectedIndustry, "industrySavings")}
        error={!!err.industrySavings}
        readOnly={readOnly}
      />
    </>
  );

  return (
    <ParameterAccordion
      title="Industry Parameters"
      advancedTitle="Advanced Industry Settings"
      advancedContent={advancedFields}
      defaultAdvancedOpen={false}
    >
      {coreFields}
    </ParameterAccordion>
  );
}
