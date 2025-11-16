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

// Function to generate default parameters for one demographic
const getDefaultDemographicParams = () => ({
  meanIncome: 50000,
  sdIncome: 15000,
  proportion: 33,
  meanSavings: 10000,
  sdSavings: 5000,
  // UI label is (%) so we validate against 0–100.
  // Current default 0.05 means 0.05% (change to 5 if you intend 5%).
  unemploymentRate: 0.05,
  // Flat per-industry spending shares (keys match IndustryType enum keys)
  GROCERIES: 25,
  UTILITIES: 18,
  AUTOMOBILES: 2,
  HOUSING: 41,
  HOUSEHOLD_GOODS: 8,
  ENTERTAINMENT: 4,
  LUXURY: 2,
});

// Function to generate default parameters for one industry
const getDefaultIndustryParams = () => ({
  startingInventory: 1000,
  startingPrice: 10,
  industrySavings: 50000,
  offeredWage: 15,
});

export default function SetupPage() {
  const navigate = useNavigate();

  const [backendError, setBackendError] = useState(null);

  // Flat error messages for the bottom Alert
  const [formErrors, setFormErrors] = useState({});
  // Field-level flags to paint inputs red
  const [inputErrors, setInputErrors] = useState({
    env: {},
    demo: {},
    industry: {},
    policy: {},
  });

  // ----- Initial state with Price Cap + toggles + override containers -----
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
      // Regular values
      salesTax: 7,
      corporateTax: 21,
      personalIncomeTax: 15,
      propertyTax: 10,
      tariffs: 5,
      subsidies: 20,
      minimumWage: 7.25, // $/hr
      priceCap: "",      // $ (blank means "inherit or not set")

      // Global toggles
      enabled: {
        salesTax: true,
        corporateTax: true,
        personalIncomeTax: true,
        propertyTax: true,
        tariffs: true,
        subsidies: true,
        minimumWage: true,
        priceCap: false, // default off
      },

      // Override containers (inherit when blank)
      byIndustry: Object.fromEntries(
        Object.keys(IndustryType).map((k) => [k, {}])
      ),
      byDemographic: Object.fromEntries(
        Object.values(Demographic).map((d) => [d, {}])
      ),
    },
  });

  // ---------- Validation ----------
  useEffect(() => {
    const msgs = {};
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
    if (isBlank(env.maxSimulationLength) || Number(env.maxSimulationLength) <= 10) {
      msgs.env_maxSimulationLength =
        "Environmental: Max simulation length must be greater than 10 weeks.";
      flags.env.maxSimulationLength = true;
    }
    if (isBlank(env.numPeople) || Number(env.numPeople) <= 0) {
      msgs.env_numPeople = "Environmental: Total people must be greater than 0.";
      flags.env.numPeople = true;
    }

    // ----- Demographics -----
    const demoOrder = Object.values(Demographic);
    const industryKeys = Object.keys(IndustryType);

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

      // Unemployment 0–100
      if (isBlank(d?.unemploymentRate) || Number(d?.unemploymentRate) < 0 || Number(d?.unemploymentRate) > 100) {
        msgs[`demo_unemp_${dk}`] = `Demographics (${dk}): Unemployment rate must be between 0 and 100.`;
        markDemo(dk, "unemploymentRate");
      }

      // Std dev > 0
      if (isBlank(d?.sdIncome) || Number(d?.sdIncome) <= 0) {
        msgs[`demo_sdIncome_${dk}`] = `Demographics (${dk}): Income standard deviation must be greater than 0.`;
        markDemo(dk, "sdIncome");
      }
      if (isBlank(d?.sdSavings) || Number(d?.sdSavings) <= 0) {
        msgs[`demo_sdSavings_${dk}`] = `Demographics (${dk}): Savings standard deviation must be greater than 0.`;
        markDemo(dk, "sdSavings");
      }

      // Optional sanity checks
      if (isBlank(d?.meanIncome) || Number(d?.meanIncome) <= 0) {
        msgs[`demo_meanIncome_${dk}`] = `Demographics (${dk}): Mean income must be greater than 0.`;
        markDemo(dk, "meanIncome");
      }
      if (isBlank(d?.meanSavings) || Number(d?.meanSavings) < 0) {
        msgs[`demo_meanSavings_${dk}`] = `Demographics (${dk}): Mean savings must be 0 or greater.`;
        markDemo(dk, "meanSavings");
      }

      // Flat per-industry spending behavior must sum to ~100
      const spendingSum = industryKeys.reduce(
        (sum, key) => sum + (Number(d?.[key]) || 0),
        0
      );
      if (Math.abs(spendingSum - 100) > 0.1) {
        msgs[`demo_spending_${dk}`] = `Demographics (${dk}): Spending behavior percentages must add up to 100%. Current sum: ${spendingSum.toFixed(
          1
        )}% (${(100 - spendingSum).toFixed(1)}% remaining).`;
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
        msgs[`demo_meanIncome_monotonic_${currKey}`] =
          `Demographics: Mean income for "${currKey}" must be greater than "${prevKey}".`;
        markDemo(currKey, "meanIncome");
      }
    }

    // ----- Industry -----
    Object.values(IndustryType).forEach((ik) => {
      const ind = params.industryParams[ik];
      if (isBlank(ind?.startingInventory) || Number(ind?.startingInventory) <= 0) {
        msgs[`industry_inventory_${ik}`] =
          `Industry (${ik}): Starting inventory must be greater than 0.`;
        markIndustry(ik, "startingInventory");
      }
      if (isBlank(ind?.startingPrice) || Number(ind?.startingPrice) <= 0) {
        msgs[`industry_price_${ik}`] =
          `Industry (${ik}): Starting price must be greater than 0.`;
        markIndustry(ik, "startingPrice");
      }
      if (isBlank(ind?.industrySavings) || Number(ind?.industrySavings) <= 0) {
        msgs[`industry_savings_${ik}`] =
          `Industry (${ik}): Industry savings must be greater than 0.`;
        markIndustry(ik, "industrySavings");
      }
      if (isBlank(ind?.offeredWage) || Number(ind?.offeredWage) <= 0) {
        msgs[`industry_wage_${ik}`] =
          `Industry (${ik}): Offered wage must be greater than 0.`;
        markIndustry(ik, "offeredWage");
      }
    });

    // ----- Policies (respect toggles) -----
    const p = params.policyParams;
    const en = p.enabled || {};

    const pctKeys = [
      ["salesTax", "Sales tax"],
      ["corporateTax", "Corporate income tax"],
      ["personalIncomeTax", "Personal income tax"],
      ["propertyTax", "Property tax"],
      ["tariffs", "Tariffs"],
      ["subsidies", "Subsidies"],
    ];

    pctKeys.forEach(([k, label]) => {
      if (!en[k]) return; // skip validation if disabled
      const v = Number(p?.[k]);
      if (isNaN(v) || v < 0 || v > 100) {
        msgs[`policy_${k}`] = `Policies: ${label} must be between 0 and 100%.`;
        flags.policy[k] = true;
      }
    });

    if (en.minimumWage) {
      if (isBlank(p?.minimumWage) || Number(p?.minimumWage) <= 0) {
        msgs.policy_minimumWage = "Policies: Minimum wage must be greater than 0.";
        flags.policy.minimumWage = true;
      }
    }

    // Price Cap global ($): required only when enabled
    if (en.priceCap) {
      const v = Number(p?.priceCap);
      if (isNaN(v) || v <= 0) {
        msgs.priceCap = "Policies: Price Cap ($) must be greater than 0 when enabled.";
        flags.policy.priceCap = true;
      }
    }

    // Per-industry Price Cap overrides ($): if provided, must be > 0
    Object.keys(p.byIndustry || {}).forEach((k) => {
      const r = p.byIndustry[k];
      const val = r?.priceCap;
      if (val !== "" && val !== undefined && val !== null) {
        const n = Number(val);
        if (isNaN(n) || n <= 0) {
          if (!flags.byIndustry) flags.byIndustry = {};
          if (!flags.byIndustry[k]) flags.byIndustry[k] = {};
          flags.byIndustry[k].priceCap = true;
          msgs[`policy_priceCap_${k}`] = `Policies: Price Cap Override ($) for ${k} must be greater than 0.`;
        }
      }
    });

    setFormErrors(msgs);
    setInputErrors(flags);
  }, [params]);

  // ---------- Handlers (typing-friendly) ----------
  const handleEnvChange = (key) => (event) => {
    const value =
      event.target.type === "checkbox" ? event.target.checked : event.target.value;
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
    const { value } = event.target;
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
      policyParams: { ...prev.policyParams, [key]: value },
    }));
  };

  const handlePolicyToggle = (key) => (_event, checked) => {
    setParams((prev) => ({
      ...prev,
      policyParams: {
        ...prev.policyParams,
        enabled: {
          ...(prev.policyParams.enabled || {}),
          [key]: !!checked,
        },
      },
    }));
  };

  const handlePolicyIndustryOverrideChange =
    (industryKey, field) =>
    (event) => {
      const { value } = event.target;
      setParams((prev) => ({
        ...prev,
        policyParams: {
          ...prev.policyParams,
          byIndustry: {
            ...(prev.policyParams.byIndustry || {}),
            [industryKey]: {
              ...(prev.policyParams.byIndustry?.[industryKey] || {}),
              [field]: value,
            },
          },
        },
      }));
    };

  const handlePolicyDemographicOverrideChange =
    (demoKey, field) =>
    (event) => {
      const { value } = event.target;
      setParams((prev) => ({
        ...prev,
        policyParams: {
          ...prev.policyParams,
          byDemographic: {
            ...(prev.policyParams.byDemographic || {}),
            [demoKey]: {
              ...(prev.policyParams.byDemographic?.[demoKey] || {}),
              [field]: value,
            },
          },
        },
      }));
    };

  // Send parameters to backend and navigate to simulation view
  const handleBegin = async () => {
    setBackendError(null);
    try {
      const modelId = await SimulationAPI.createModel(params);
      navigate(`/BaseSimView`, {
        state: { modelId: modelId, industryParams: params.industryParams },
      });
    } catch (error) {
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
        handlePolicyToggle={handlePolicyToggle}
        handlePolicyIndustryOverrideChange={handlePolicyIndustryOverrideChange}
        handlePolicyDemographicOverrideChange={handlePolicyDemographicOverrideChange}
        formErrors={inputErrors.policy}
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
            <ul style={{ margin: "0.5rem 0 0 1rem", padding: 0, textAlign: "left" }}>
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
