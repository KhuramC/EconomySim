import { useState, useEffect } from "react";
import { Typography, Alert, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

import EnvironmentalAccordion from "../../components/SimSetup/EnvironmentalAccordion.jsx";
import DemographicAccordion from "../../components/SimSetup/DemographicAccordion.jsx";
import IndustryAccordion from "../../components/SimSetup/IndustryAccordion.jsx";
import PolicyAccordion from "../../components/SimSetup/PolicyAccordion.jsx";

import { Demographic } from "../../types/Demographic.js";
import { IndustryType } from "../../types/IndustryType.js";
import { SimulationAPI } from "../../api/SimulationAPI.js";

//Function to generate default parameters for one demographic
const getDefaultDemographicParams = () => ({
  meanIncome: 50000,
  sdIncome: 15000,
  proportion: 33,
  spendingBehavior: 70,
  meanSavings: 10000,
  sdSavings: 5000,
  unemploymentRate: 0.05,
  GROCERIES: 25,
  UTILITIES: 18,
  AUTOMOBILES: 2,
  HOUSING: 41,
  HOUSEHOLD_GOODS: 8,
  ENTERTAINMENT: 4,
  LUXURY: 2,
});

//Function to generate default parameters for one industry
const getDefaultIndustryParams = () => ({
  startingInventory: 1000,
  startingPrice: 10,
  industrySavings: 50000,
  offeredWage: 15,
});

export default function SetupPage() {
  const navigate = useNavigate();

  const [backendError, setBackendError] = useState(null);

  const [formErrors, setFormErrors] = useState({});

  const [params, setParams] = useState({
    envParams: {
      numPeople: 1000,
      maxSimulationLength: 100,
      inflationRate: 1.0,
      randomEvents: false,
    },

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

    policyParams: {
      // TODO: update to be industry and demographic specific
      salesTax: 7,
      corporateTax: 21,
      personalIncomeTax: 15,
      propertyTax: 10,
      tariffs: 5,
      subsidies: 20,
      rentCap: 20,
      minimumWage: 7.25,
    },
  });

  // Validate form inputs whenever params change
  useEffect(() => {
    const errors = {};

    // Demographic Validations //
    const proportionSum = Object.values(params.demoParams).reduce(
      (sum, demoData) => {
        return sum + demoData.proportion;
      },
      0
    );

    // Clear error message when proportion sum becomes valid
    if (proportionSum !== 100) {
      errors.proportion = `Demographic proportions must add up to 100%. Current sum:
            ${proportionSum.toFixed(1)}% (${(100 - proportionSum).toFixed(1)}%
            remaining).`;
    }

    const spendingBehaviorOptions = IndustryType;

    // Loop through each demographic group
    Object.entries(params.demoParams).forEach(([demoName, demoData]) => {
      const spendingSum = Object.keys(spendingBehaviorOptions).reduce(
        (sum, key) => sum + (Number(demoData[key]) || 0),
        0
      );

      const formattedDemoName = demoName
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

      if (Math.abs(spendingSum - 100) > 0.1) {
        // small tolerance for rounding
        errors[
          demoName
        ] = `Spending behavior percentages for "${formattedDemoName}" must add up to 100%. Current sum: ${spendingSum.toFixed(
          1
        )}% (${(100 - spendingSum).toFixed(1)}% remaining).`;
      }
    });

    setFormErrors(errors);
  }, [params]);

  //Environmental-specific handler
  const handleEnvChange = (key) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    setParams((prev) => ({
      ...prev,
      envParams: {
        ...prev.envParams,
        [key]: event.target.type === "number" ? parseFloat(value) || 0 : value,
      },
    }));
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

  // Policy-specific handler
  const handlePolicyChange = (key) => (event) => {
    const { value } = event.target;
    setParams((prev) => ({
      ...prev,
      policyParams: {
        ...prev.policyParams,
        [key]: event.target.type === "number" ? parseFloat(value) || 0 : value,
      },
    }));
  };

  // Send parameters to backend and navigate to simulation view
  const handleBegin = async () => {
    setBackendError(null);
    try {
      console.log("Simulation parameters:", params);
      const modelId = await SimulationAPI.createModel(params);
      console.log("Model created with ID:", modelId);
      // Navigate to simulation view with the new model ID
      navigate(`/BaseSimView`, { state: { modelId: modelId } });
    } catch (error) {
      console.error("Error creating model:", error.message);
      setBackendError(error.message);
    }
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

      <EnvironmentalAccordion
        envParams={params.envParams}
        handleEnvChange={handleEnvChange}
        formErrors={formErrors}
      />

      <DemographicAccordion
        demoParams={params.demoParams}
        handleDemographicChange={handleDemographicChange}
        formErrors={formErrors}
      />

      <IndustryAccordion
        industryParams={params.industryParams}
        handleIndustryChange={handleIndustryChange}
        formErrors={formErrors}
      />

      <PolicyAccordion
        policyParams={params.policyParams}
        handlePolicyChange={handlePolicyChange}
        formErrors={formErrors}
      />

      {backendError && (
        <Alert
          severity="error"
          sx={{ mt: 3 }}
          onClose={() => setBackendError(null)} // Allow user to dismiss
        >
          {backendError}
        </Alert>
      )}

      <div style={{ marginTop: "2rem" }}>
        {Object.keys(formErrors).length == 0 ? (
          // Render the button if no form errors
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
          // Render form errors if present
          <Alert severity="error" sx={{ mt: 3 }}>
            Please fix the following issues:
            <ul style={{ margin: "0.5rem 0 0 1rem", padding: 0 }}>
              {Object.values(formErrors).map((errorText) => (
                <li key={errorText}>{errorText}</li>
              ))}
            </ul>
          </Alert>
        )}
      </div>
    </div>
  );
}
