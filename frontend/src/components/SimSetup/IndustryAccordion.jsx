import { useMemo, useState } from "react";
import {
  Grid,
  Switch,
  FormControlLabel,
  Tooltip,
  MenuItem,
} from "@mui/material";
import ParameterMenuInput from "../inputs/ParameterMenuInput.jsx";
import ParameterNumInput from "../inputs/ParameterNumInput.jsx";
import ParameterAccordion from "./ParameterAccordion.jsx";
import { IndustryType } from "../../types/IndustryType.js";
/**
 * Industry section with tooltips for each field.
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

  const industrySelector = (
    <ParameterMenuInput
      label="Industry"
      value={selectedIndustry}
      onChange={handleSelectedIndustryChange}
      xs={12}
      helpText="Choose which industry you are editing. Values below apply only to the selected industry."
    >
      {industryValues.map((value) => (
        <MenuItem key={value} value={value}>
          <span>{value}</span>
        </MenuItem>
      ))}
    </ParameterMenuInput>
  );
  const coreFields = (
    <>
      <ParameterNumInput
        label={starting === true ? "Starting Price ($)" : "Price ($)"}
        value={current.startingPrice}
        onChange={handleIndustryChange(selectedIndustry, "startingPrice")}
        error={!!err.startingPrice}
        readOnly={readOnly}
        helpText={
          starting === true
            ? "Initial price charged by this industry. Market dynamics may move it over time."
            : "Current price charged by this industry. Market dynamics may move it over time."
        }
      />

      <ParameterNumInput
        label={
          starting === true ? "Offered Wage ($/hr)" : "Current Wage ($/hr)"
        }
        value={current.offeredWage}
        onChange={handleIndustryChange(selectedIndustry, "offeredWage")}
        error={!!err.offeredWage}
        readOnly={readOnly}
        helpText="Hourly wage offered to workers. Wages influence hiring and job changes."
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
        helpText={
          starting === true
            ? "Units of stock in the starting inventory. Inventory plus production determine how much can be sold."
            : "Units of stock in inventory. Inventory plus production determine how much can be sold."
        }
      />

      <ParameterNumInput
        label={starting === true ? "Starting Balance ($)" : "Balance ($)"}
        value={current.industrySavings}
        onChange={handleIndustryChange(selectedIndustry, "industrySavings")}
        error={!!err.industrySavings}
        readOnly={readOnly}
        helpText="Cash reserves available to the firm. Affects pricing flexibility, hiring, and investment."
      />

      <ParameterNumInput
        label={
          starting === true
            ? "Starting Number of Employees"
            : "Number of Employees"
        }
        value={current.startingNumEmployees}
        onChange={handleIndustryChange(
          selectedIndustry,
          "startingNumEmployees"
        )}
        error={!!err.startingNumEmployees}
        readOnly={readOnly}
        helpText="Number of employees at the start. Affects production capacity and operational efficiency."
      />
      {starting === true ? (
        <>
          <ParameterNumInput
            label={
              starting === true
                ? "Starting Fixed Costs ($/week)"
                : "Fixed Costs ($/week)"
            }
            value={current.startingFixedCost}
            onChange={handleIndustryChange(
              selectedIndustry,
              "startingFixedCost"
            )}
            error={!!err.startingFixedCost}
            readOnly={readOnly}
            helpText="Fixed costs incurred weekly regardless of production levels."
          />

          <ParameterNumInput
            label={
              starting === true
                ? "Starting Raw Material Cost ($/unit)"
                : "Raw Material Cost ($/unit)"
            }
            value={current.startingMaterialCost}
            onChange={handleIndustryChange(
              selectedIndustry,
              "startingMaterialCost"
            )}
            error={!!err.startingMaterialCost}
            readOnly={readOnly}
            helpText="Cost of raw materials needed for production of an individual item. Influences overall expenses and pricing."
          />

          <ParameterNumInput
            label={
              starting === true
                ? "Starting Worker Efficiency (unit/hr)"
                : "Worker Efficiency (unit/hr)"
            }
            value={current.startingEmpEfficiency}
            onChange={handleIndustryChange(
              selectedIndustry,
              "startingEmpEfficiency"
            )}
            error={!!err.startingEmpEfficiency}
            readOnly={readOnly}
            helpText="Efficiency of each employee in goods produced per hour. Affects productivity and output levels."
          />

          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!current.startingDebtAllowed}
                  onChange={handleIndustryChange(
                    selectedIndustry,
                    "startingDebtAllowed"
                  )}
                />
              }
              label={
                <Tooltip
                  title="Enable the industry to go into debt. Allows the industry to be more flexible."
                  arrow
                >
                  <span>Debt Allowed</span>
                </Tooltip>
              }
            />
          </Grid>
        </>
      ) : null}
    </>
  );

  return (
    <ParameterAccordion
      title="Industry Parameters"
      selector={industrySelector}
      advancedTitle="Advanced Industry Settings"
      advancedContent={advancedFields}
      defaultAdvancedOpen={false}
    >
      {coreFields}
    </ParameterAccordion>
  );
}
