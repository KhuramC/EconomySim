import React, { useState, useMemo } from "react";
import {
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  Button,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import ParameterMenuInput from "../../components/ParameterMenuInput.jsx";
import ParameterNumInput from "../../components/ParameterNumInput.jsx";
import ParameterAccordion from "../../components/ParameterAccordion.jsx";
import { Demographic } from "../../types/Demographic.js";
import { IndustryType } from "../../types/IndustryType.js";

//Function to generate default parameters for one demographic
const getDefaultDemographicParams = () => ({
  meanIncome: 50000,
  sdIncome: 15000,
  proportion: 33,
  spendingBehavior: 70,
  meanSavings: 10000,
  sdSavings: 5000,
  unemploymentRate: 0.05,
});

//Function to generate default parameters for one industry
const getDefaultIndustryParams = () => ({
  startingInventory: 1000,
  startingPrice: 10,
  industrySavings: 50000,
  employees: 0,
  offeredWage: 15,
});

export default function SetupPage() {
  const navigate = useNavigate();
  const [params, setParams] = useState({
    // Environmental
    numPeople: 1000,
    maxSimulationLength: 100,
    randomEvents: false,
    inflationRate: 2.0,

    demoParams: Object.fromEntries(
      Object.values(Demographic).map((value) => [
        value,
        getDefaultDemographicParams(),
      ])
    ),

    industryParams: Object.fromEntries(
      Object.values(IndustryType).map((value) => [
        value,
        getDefaultIndustryParams(),
      ])
    ),

    // Government Policy
    salesTax: 7,
    corporateTax: 21,
    personalIncomeTax: 15,
    propertyTax: 1000,
    tariffs: 5,
    subsidies: 2000,
    rentCap: 2000,
    minimumWage: 7.25,
  });

  const [selectedDemographic, setSelectedDemographic] = useState(
    Object.values(Demographic)[0]
  );
  const [selectedIndustry, setSelectedIndustry] = useState(
    Object.values(IndustryType)[0]
  );

  const proportionSum = useMemo(() => {
    return Object.values(params.demoParams).reduce((sum, demoData) => {
      // Sum up the proportion values
      return sum + demoData.proportion;
    }, 0);
  }, [params.demoParams]); // Recalculate only when demoParams changes
  const isProportionSumValid = proportionSum === 100;

  const handleChange = (key) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // Demographic-specific handler
  const handleDemographicChange = (demographicValue, prop) => (event) => {
    const { value } = event.target;
    setParams((prevParams) => ({
      ...prevParams,
      demoParams: {
        ...prevParams.demoParams,
        [demographicValue]: {
          ...prevParams.demoParams[demographicValue],
          // Convert numbers, handle percentages/rates appropriately
          [prop]:
            event.target.type === "number" ? parseFloat(value) || 0 : value,
        },
      },
    }));
  };

  // Industry-specific handler
  const handleIndustryChange = (industryValue, prop) => (event) => {
    const { value } = event.target;
    setParams((prevParams) => ({
      ...prevParams,
      industryParams: {
        ...prevParams.industryParams,
        [industryValue]: {
          ...prevParams.industryParams[industryValue],
          [prop]:
            event.target.type === "number" ? parseFloat(value) || 0 : value,
        },
      },
    }));
  };

  // Handler for demographic selector dropdown
  const handleSelectedDemographicChange = (event) => {
    setSelectedDemographic(event.target.value);
  };
  // Handler for industry selector dropdown
  const handleSelectedIndustryChange = (event) => {
    setSelectedIndustry(event.target.value);
  };

  const handleSliderChange = (key) => (_, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleBegin = () => {
    console.log("Simulation parameters:", params);
    navigate("/BaseSimView");
  };

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "1rem" }}>
      <Typography variant="h4" gutterBottom>
        Simulation Setup
      </Typography>
      <Typography variant="body1" paragraph>
        Configure the starting parameters for your simulation. These values
        affect how the environment, demographics, industries, and policies
        behave when the simulation begins.
      </Typography>

      {/* Environmental */}
      <ParameterAccordion title="Environmental Parameters" defaultExpanded>
        <ParameterNumInput
          label="Max Simulation Length (weeks)"
          value={params.maxSimulationLength}
          onChange={handleChange("maxSimulationLength")}
        />
        <ParameterNumInput
          label="Total People"
          value={params.numPeople}
          onChange={handleChange("numPeople")}
        />
        <ParameterNumInput
          label="National Inflation Rate (%/week)"
          value={params.inflationRate}
          onChange={handleChange("inflationRate")}
        />

        <FormControlLabel
          control={
            <Switch
              checked={params.randomEvents}
              onChange={handleChange("randomEvents")}
            />
          }
          label="Random Events"
        />
      </ParameterAccordion>

      {/* Demographic */}
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
          value={params.demoParams[selectedDemographic].proportion}
          onChange={handleDemographicChange(selectedDemographic, "proportion")}
          error={
            !isProportionSumValid &&
            params.demoParams[selectedDemographic]?.proportion !== ""
          }
        />
        <ParameterNumInput
          label="Starting Unemployment Rate (%)"
          value={params.demoParams[selectedDemographic].unemploymentRate}
          onChange={handleDemographicChange(
            selectedDemographic,
            "unemploymentRate"
          )}
        />
        <ParameterNumInput
          label="Mean Income ($/week)"
          value={params.demoParams[selectedDemographic].meanIncome}
          onChange={handleDemographicChange(selectedDemographic, "meanIncome")}
        />
        <ParameterNumInput
          label="Income Std. Deviation ($)"
          value={params.demoParams[selectedDemographic].sdIncome}
          onChange={handleDemographicChange(selectedDemographic, "sdIncome")}
        />
        <ParameterNumInput
          label="Mean Savings ($)"
          value={params.demoParams[selectedDemographic].meanSavings}
          onChange={handleDemographicChange(selectedDemographic, "meanSavings")}
        />
        <ParameterNumInput
          label="Savings Std. Deviation ($)"
          value={params.demoParams[selectedDemographic].sdSavings}
          onChange={handleDemographicChange(selectedDemographic, "sdSavings")}
        />
        <ParameterNumInput
          label="Spending Behavior (% Income)"
          value={params.demoParams[selectedDemographic].spendingBehavior}
          onChange={handleDemographicChange(
            selectedDemographic,
            "spendingBehavior"
          )}
        />
      </ParameterAccordion>

      {/* Industry */}
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
          value={params.industryParams[selectedIndustry].startingInventory}
          onChange={handleIndustryChange(selectedIndustry, "startingInventory")}
        />
        <ParameterNumInput
          label="Starting Price ($)"
          value={params.industryParams[selectedIndustry].startingPrice}
          onChange={handleIndustryChange(selectedIndustry, "startingPrice")}
        />
        <ParameterNumInput
          label="Industry Savings ($)"
          value={params.industryParams[selectedIndustry].industrySavings}
          onChange={handleIndustryChange(selectedIndustry, "industrySavings")}
        />
        <ParameterNumInput
          label="Number of Employees"
          value={params.industryParams[selectedIndustry].employees}
          onChange={handleIndustryChange(selectedIndustry, "employees")}
        />
        <ParameterNumInput
          label="Offered Wage ($/hr)"
          value={params.industryParams[selectedIndustry].offeredWage}
          onChange={handleIndustryChange(selectedIndustry, "offeredWage")}
          min={params.minimumWage}
        />
      </ParameterAccordion>

      {/* Policy */}
      <ParameterAccordion title="Starting Government Policies">
        <ParameterNumInput
          label="Sales Tax (%)"
          value={params.salesTax}
          onChange={handleChange("salesTax")}
        />
        <ParameterNumInput
          label="Corporate Income Tax (%)"
          value={params.corporateTax}
          onChange={handleChange("corporateTax")}
        />
        <ParameterNumInput
          label="Personal Income Tax (%)"
          value={params.personalIncomeTax}
          onChange={handleChange("personalIncomeTax")}
        />
        <ParameterNumInput
          label="Property Tax (%)"
          value={params.propertyTax}
          onChange={handleChange("propertyTax")}
        />
        <ParameterNumInput
          label="Tariffs (%)"
          value={params.tariffs}
          onChange={handleChange("tariffs")}
        />
        <ParameterNumInput
          label="Subsidies (%)"
          value={params.subsidies}
          onChange={handleChange("subsidies")}
        />
        <ParameterNumInput
          label="Rent Cap ($)"
          value={params.rentCap}
          onChange={handleChange("rentCap")}
        />
        <ParameterNumInput
          label="Minimum Wage ($/hr)"
          value={params.minimumWage}
          onChange={handleChange("minimumWage")}
        />
      </ParameterAccordion>

      {/* Begin Simulation Button */}
      <div style={{ marginTop: "2rem" }}>
        {isProportionSumValid ? (
          // Render the button if the sum is valid
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleBegin}
            sx={{ mt: 3, borderRadius: 2 }}
          >
            Begin Simulation
          </Button>
        ) : (
          // Render an error message if the proprtion sum is invalid
          <Alert severity="error" sx={{ mt: 3 }}>
            {/* Use Alert with error severity */}
            Demographic proportions must add up to 100%. Current sum:{" "}
            {proportionSum.toFixed(1)}% ({(100 - proportionSum).toFixed(1)}%
            remaining).
          </Alert>
        )}
      </div>
    </div>
  );
}
