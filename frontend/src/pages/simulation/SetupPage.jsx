import { useState, useEffect } from "react";
import { Typography, Alert, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

import EnvironmentalAccordion from "../../components/simSetup/EnvironmentalAccordion";
import DemographicAccordion from "../../components/simSetup/DemographicAccordion";
import IndustryAccordion from "../../components/simSetup/IndustryAccordion";
import PolicyAccordion from "../../components/simSetup/PolicyAccordion";

import TemplateChooser from "../../components/simSetup/TemplateChooser";

import { Demographic } from "../../types/Demographic";
import { IndustryType } from "../../types/IndustryType";
import { SimulationAPI } from "../../api/SimulationAPI";

// Function to generate default parameters for one demographic
const getDefaultDemographicParams = () => {
  const spendingAllocation = {
    [IndustryType.GROCERIES]: 25,
    [IndustryType.UTILITIES]: 18,
    [IndustryType.AUTOMOBILES]: 2,
    [IndustryType.HOUSING]: 41,
    [IndustryType.HOUSEHOLD_GOODS]: 8,
    [IndustryType.ENTERTAINMENT]: 4,
    [IndustryType.LUXURY]: 2,
  };
  return {
    meanIncome: 50000,
    sdIncome: 15000,
    proportion: 33,
    meanSavings: 10000,
    sdSavings: 5000,
    ...spendingAllocation,
  };
};

// Function to generate default parameters for one industry
const getDefaultIndustryParams = () => ({
  startingInventory: 1000,
  startingPrice: 10,
  industrySavings: 50000,
  offeredWage: 15,
  startingFixedCost: 100,
  startingMaterialCost: 5,
  startingNumEmployees: 10,
  startingEmpEfficiency: 1.0,
  startingDebtAllowed: true,
});

// Helper: This creates a dictionary of { [IndustryType.*]: defaultValue }
const makeIndustryDict = (defaultValue) =>
  Object.fromEntries(
    Object.values(IndustryType).map((industry) => [industry, defaultValue])
  );

// Helper: default PIT brackets per demographic
const makePersonalIncomeTaxByDemographicDefault = () =>
  Object.fromEntries(
    Object.values(Demographic).map((demo) => [
      demo,
      [{ threshold: 0, rate: 0 }],
    ])
  );

export default function SetupPage() {
  const navigate = useNavigate();

  const [backendError, setBackendError] = useState(null);

  // Error messages for the bottom Alert (flat, human-readable)
  const [formErrors, setFormErrors] = useState({});
  // Field-level error flags used to paint inputs red (nested by section)
  const [inputErrors, setInputErrors] = useState({
    env: {},
    demo: {},
    industry: {},
    policy: {},
  });

  const [params, setParams] = useState({
    envParams: {
      numPeople: 1000,
      maxSimulationLength: 100,
      inflationRate: 1.0,
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
      // Global values
      salesTax: 7,
      corporateTax: 21,
      personalIncomeTax: [{ threshold: 0, rate: 0.0 }],
      propertyTax: 10,
      tariffs: 5,
      subsidies: 20,
      priceCap: 20, // % > 0
      priceCapEnabled: false,
      minimumWage: 7.25, // $/hr > 0

      // Per-industry overrides
      salesTaxByIndustry: makeIndustryDict(7),
      corporateTaxByIndustry: makeIndustryDict(21),
      tariffsByIndustry: makeIndustryDict(5),
      subsidiesByIndustry: makeIndustryDict(20),
      priceCapByIndustry: makeIndustryDict(20),
      priceCapEnabledByIndustry: makeIndustryDict(false),

      // Per-demographic Personal Income Tax
      personalIncomeTaxByDemographic: makePersonalIncomeTaxByDemographicDefault(),
    },
  });

  // ---------- Validation ----------
  useEffect(() => {
    // Collect human-readable messages
    const msgs = {};
    // Collect field-level boolean flags
    const flags = { env: {}, demo: {}, industry: {}, policy: {} };

    const isBlank = (v) => v === "" || v === null || v === undefined;

    const markDemo = (dk, key) => {
      if (!flags.demo[dk]) flags.demo[dk] = {};
      flags.demo[dk][key] = true;
    };
    const markIndustry = (ik, key) => {
      if (!flags.industry[ik]) flags.industry[ik] = {};
      flags.industry[ik][key] = true;
    };

    // ----- Environmental -----
    const env = params.envParams;
    if (
      isBlank(env.maxSimulationLength) ||
      Number(env.maxSimulationLength) <= 10
    ) {
      msgs.env_maxSimulationLength =
        "Environmental: Max simulation length must be greater than 10 weeks.";
      flags.env.maxSimulationLength = true;
    }
    if (isBlank(env.numPeople) || Number(env.numPeople) <= 0) {
      msgs.env_numPeople =
        "Environmental: Total people must be greater than 0.";
      flags.env.numPeople = true;
    }

    // ----- Demographics -----
    const demoOrder = Object.values(Demographic);
    const industryKeys = Object.values(IndustryType);

    // Proportions must total 100
    const proportionSum = Object.values(params.demoParams).reduce(
      (sum, d) => sum + Number(d.proportion || 0),
      0
    );
    if (Math.round(proportionSum) !== 100) {
      msgs.proportion = `Demographic proportions must add up to 100%. Current sum: ${proportionSum.toFixed(
        1
      )}% (${(100 - proportionSum).toFixed(1)}% remaining).`;
      demoOrder.forEach((dk) => markDemo(dk, "proportion"));
    }

    // Per-demographic checks
    demoOrder.forEach((dk) => {
      const d = params.demoParams[dk];

      // Std dev > 0
      if (isBlank(d?.sdIncome) || Number(d?.sdIncome) <= 0) {
        msgs[
          `demo_sdIncome_${dk}`
        ] = `Demographics (${dk}): Income standard deviation must be greater than 0.`;
        markDemo(dk, "sdIncome");
      }
      if (isBlank(d?.sdSavings) || Number(d?.sdSavings) <= 0) {
        msgs[
          `demo_sdSavings_${dk}`
        ] = `Demographics (${dk}): Savings standard deviation must be greater than 0.`;
        markDemo(dk, "sdSavings");
      }

      // Optional sanity checks
      if (isBlank(d?.meanIncome) || Number(d?.meanIncome) <= 0) {
        msgs[
          `demo_meanIncome_${dk}`
        ] = `Demographics (${dk}): Mean income must be greater than 0.`;
        markDemo(dk, "meanIncome");
      }
      if (isBlank(d?.meanSavings) || Number(d?.meanSavings) < 0) {
        msgs[
          `demo_meanSavings_${dk}`
        ] = `Demographics (${dk}): Mean savings must be 0 or greater.`;
        markDemo(dk, "meanSavings");
      }

      // Flat per-industry spending behavior must sum to ~100
      const spendingSum = industryKeys.reduce(
        (sum, key) => sum + (Number(d?.[key]) || 0),
        0
      );
      if (Math.abs(spendingSum - 100) > 0.1) {
        msgs[
          `demo_spending_${dk}`
        ] = `Demographics (${dk}): Spending behavior percentages must add up to 100%. Current sum: ${spendingSum.toFixed(
          1
        )}% (${(100 - spendingSum).toFixed(1)}% remaining).`;
        // Mark every cell in that row so all become red
        industryKeys.forEach((k) => markDemo(dk, k));
      }
    });

    // Mean income monotonic by enum order (strictly increasing)
    for (let i = 1; i < demoOrder.length; i++) {
      const prevKey = demoOrder[i - 1];
      const currKey = demoOrder[i];
      const prev = Number(params.demoParams[prevKey]?.meanIncome);
      const curr = Number(params.demoParams[currKey]?.meanIncome);
      if (!(curr > prev)) {
        msgs[
          `demo_meanIncome_monotonic_${currKey}`
        ] = `Demographics: Mean income for "${currKey}" must be greater than "${prevKey}".`;
        markDemo(currKey, "meanIncome");
      }
    }

    // ----- Industry -----
    Object.values(IndustryType).forEach((ik) => {
      const ind = params.industryParams[ik];

      // Non-negative checks (> 0)
      const greaterThanZeroFields = [
        ["startingInventory", "Starting inventory"],
        ["startingPrice", "Starting price"],
        ["industrySavings", "Industry savings"],
        ["offeredWage", "Offered wage"],
        ["startingEmpEfficiency", "Worker efficiency"],
      ];

      greaterThanZeroFields.forEach(([key, label]) => {
        if (isBlank(ind?.[key]) || Number(ind?.[key]) <= 0) {
          msgs[
            `industry_${key}_${ik}`
          ] = `Industry (${ik}): ${label} must be greater than 0.`;
          markIndustry(ik, key);
        }
      });

      // Zero or greater checks (>= 0)
      const zeroOrGreaterFields = [
        ["startingFixedCost", "Fixed costs"],
        ["startingMaterialCost", "Raw material cost"],
        ["startingNumEmployees", "Number of employees"],
      ];

      zeroOrGreaterFields.forEach(([key, label]) => {
        if (isBlank(ind?.[key]) || Number(ind?.[key]) < 0) {
          msgs[
            `industry_${key}_${ik}`
          ] = `Industry (${ik}): ${label} must be non-negative.`;
          markIndustry(ik, key);
        }
      });
    });

    // ----- Policies -----
    const p = params.policyParams;
    const pctKeys = [
      ["salesTax", "Sales tax"],
      ["corporateTax", "Corporate income tax"],
      ["propertyTax", "Property tax"],
      ["tariffs", "Tariffs"],
      ["subsidies", "Subsidies"],
      ["priceCap", "Price cap"],
    ];
    pctKeys.forEach(([k, label]) => {
      if (isBlank(p?.[k]) || Number(p?.[k]) < 0 || Number(p?.[k]) > 100) {
        msgs[`policy_${k}`] = `Policies: ${label} must be between 0 and 100%.`;
        flags.policy[k] = true;
      }
    });
    if (isBlank(p?.minimumWage) || Number(p?.minimumWage) <= 0) {
      msgs.policy_minimumWage =
        "Policies: Minimum wage must be greater than 0.";
      flags.policy.minimumWage = true;
    }

    p.personalIncomeTax.forEach((bracket, index) => {
      const setFlag = (field) => {
        if (!flags.policy.personalIncomeTax)
          flags.policy.personalIncomeTax = [];
        if (!flags.policy.personalIncomeTax[index])
          flags.policy.personalIncomeTax[index] = {};
        flags.policy.personalIncomeTax[index][field] = true;
      };

      if (isBlank(bracket.threshold) || Number(bracket.threshold) < 0) {
        msgs[`policy_pit_threshold_${index}`] = `Policies: Tax bracket ${
          index + 1
        } threshold must be non-negative.`;
        setFlag("threshold");
      }

      if (
        isBlank(bracket.rate) ||
        Number(bracket.rate) < 0 ||
        Number(bracket.rate) > 100
      ) {
        msgs[`policy_pit_rate_${index}`] = `Policies: Tax bracket ${
          index + 1
        } rate must be between 0-100.`;
        setFlag("rate");
      }
    });

    setFormErrors(msgs);
    setInputErrors(flags);
  }, [params]);

  // ---------- Handlers (typing-friendly) ----------
  const handleEnvChange = (key) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    setParams((prev) => ({
      ...prev,
      envParams: { ...prev.envParams, [key]: value },
    }));
  };

  const handleDemographicChange = (demographicValue, prop) => (event) => {
    const { value } = event.target;
    setParams((prev) => ({
      ...prev,
      demoParams: {
        ...prev.demoParams,
        [demographicValue]: {
          ...prev.demoParams[demographicValue],
          [prop]: value,
        },
      },
    }));
  };

  const handleIndustryChange = (industryValue, prop) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    setParams((prev) => ({
      ...prev,
      industryParams: {
        ...prev.industryParams,
        [industryValue]: {
          ...prev.industryParams[industryValue],
          [prop]: value,
        },
      },
    }));
  };

  const handlePolicyChange = (key) => (event) => {
    const { value } = event.target;
    setParams((prev) => ({
      ...prev,
      policyParams: { ...prev.policyParams, [key]: Number(value) },
    }));
  };

  // Per-industry overrides
  const handleIndustryPolicyChange = (fieldName, industryKey) => (event) => {
    const { value } = event.target;
    setParams((prev) => ({
      ...prev,
      policyParams: {
        ...prev.policyParams,
        [fieldName]: {
          ...(prev.policyParams[fieldName] || {}),
          [industryKey]: Number(value),
        },
      },
    }));
  };

  const handlePriceCapToggle = () => {
    setParams((prev) => ({
      ...prev,
      policyParams: {
        ...prev.policyParams,
        priceCapEnabled: !prev.policyParams.priceCapEnabled,
      },
    }));
  };

  // Global PIT
  const handlePersonalIncomeTaxChange = (index, field) => (event) => {
    const { value } = event.target;
    setParams((prev) => {
      const newTaxBrackets = [...prev.policyParams.personalIncomeTax];
      newTaxBrackets[index] = {
        ...newTaxBrackets[index],
        [field]: Number(value),
      };
      return {
        ...prev,
        policyParams: {
          ...prev.policyParams,
          personalIncomeTax: newTaxBrackets,
        },
      };
    });
  };

  const addPersonalIncomeTaxBracket = () => {
    setParams((prev) => ({
      ...prev,
      policyParams: {
        ...prev.policyParams,
        personalIncomeTax: [
          ...prev.policyParams.personalIncomeTax,
          { threshold: 0, rate: 0 },
        ],
      },
    }));
  };

  const removePersonalIncomeTaxBracket = (index) => {
    setParams((prev) => ({
      ...prev,
      policyParams: {
        ...prev.policyParams,
        personalIncomeTax: prev.policyParams.personalIncomeTax.filter(
          (_, i) => i !== index
        ),
      },
    }));
  };

  // Per-demographic PIT
  const handlePersonalIncomeTaxByDemoChange =
    (demographicValue, index, field) => (event) => {
      const { value } = event.target;
      setParams((prev) => {
        const prevDict =
          prev.policyParams.personalIncomeTaxByDemographic || {};
        const prevList = prevDict[demographicValue] || [];
        const newList = [...prevList];

        newList[index] = {
          ...newList[index],
          [field]: Number(value),
        };

        return {
          ...prev,
          policyParams: {
            ...prev.policyParams,
            personalIncomeTaxByDemographic: {
              ...prevDict,
              [demographicValue]: newList,
            },
          },
        };
      });
    };

  const addPersonalIncomeTaxBracketForDemo = (demographicValue) => {
    setParams((prev) => {
      const prevDict =
        prev.policyParams.personalIncomeTaxByDemographic || {};
      const prevList = prevDict[demographicValue] || [];

      return {
        ...prev,
        policyParams: {
          ...prev.policyParams,
          personalIncomeTaxByDemographic: {
            ...prevDict,
            [demographicValue]: [
              ...prevList,
              { threshold: 0, rate: 0 },
            ],
          },
        },
      };
    });
  };

  const removePersonalIncomeTaxBracketForDemo = (demographicValue, index) => {
    setParams((prev) => {
      const prevDict =
        prev.policyParams.personalIncomeTaxByDemographic || {};
      const prevList = prevDict[demographicValue] || [];

      return {
        ...prev,
        policyParams: {
          ...prev.policyParams,
          personalIncomeTaxByDemographic: {
            ...prevDict,
            [demographicValue]: prevList.filter((_, i) => i !== index),
          },
        },
      };
    });
  };

  // Send parameters to backend and navigate to simulation view
  const handleBegin = async () => {
    setBackendError(null);
    try {
      const modelId = await SimulationAPI.createModel(params);
      console.log("Model created with ID:", modelId);
      navigate(`/BaseSimView`, {
        state: { modelId: modelId, industryParams: params.industryParams },
      });
    } catch (error) {
      console.error("Error creating model:", error.message);
      setBackendError(error.message);
    }
  };

  const hasNoErrors = Object.keys(formErrors).length === 0;

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

      <TemplateChooser
        onTemplateSelect={async (template) => {
          console.log("Selected template:", template);
          const config = await SimulationAPI.getTemplateConfig(template);
          // maxSimulationLength is local-only
          config.envParams.maxSimulationLength =
            params.envParams.maxSimulationLength;
          setParams(config);
        }}
      />

      <EnvironmentalAccordion
        envParams={params.envParams}
        handleEnvChange={handleEnvChange}
        formErrors={inputErrors.env}
      />

      <DemographicAccordion
        demoParams={params.demoParams}
        handleDemographicChange={handleDemographicChange}
        formErrors={inputErrors.demo}
      />

      <IndustryAccordion
        industryParams={params.industryParams}
        handleIndustryChange={handleIndustryChange}
        formErrors={inputErrors.industry}
      />

      <PolicyAccordion
        policyParams={params.policyParams}
        handlePolicyChange={handlePolicyChange}
        formErrors={inputErrors.policy}
        handlePriceCapToggle={handlePriceCapToggle}
        handlePersonalIncomeTaxChange={handlePersonalIncomeTaxChange}
        addPersonalIncomeTaxBracket={addPersonalIncomeTaxBracket}
        removePersonalIncomeTaxBracket={removePersonalIncomeTaxBracket}
        handleIndustryPolicyChange={handleIndustryPolicyChange}
        handlePersonalIncomeTaxByDemoChange={handlePersonalIncomeTaxByDemoChange}
        addPersonalIncomeTaxBracketForDemo={addPersonalIncomeTaxBracketForDemo}
        removePersonalIncomeTaxBracketForDemo={
          removePersonalIncomeTaxBracketForDemo
        }
      />

      {backendError && (
        <Alert
          severity="error"
          sx={{
            mt: 3,
            textAlign: "left",
            alignItems: "flex-start",
            "& .MuiAlert-message": { width: "100%" },
          }}
          onClose={() => setBackendError(null)}
        >
          {backendError}
        </Alert>
      )}

      <div style={{ marginTop: "2rem" }}>
        {hasNoErrors ? (
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
          <Alert
            severity="error"
            sx={{
              mt: 3,
              textAlign: "left",
              alignItems: "flex-start",
              "& .MuiAlert-message": { width: "100%" },
            }}
          >
            Please fix the following issues:
            <ul
              style={{
                margin: "0.5rem 0 0 1rem",
                padding: 0,
                textAlign: "left",
              }}å
            >
              {Object.values(formErrors).map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </Alert>
        )}
      </div>
    </div>
  );
}
