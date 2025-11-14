// src/pages/SimSetup/SetupPage.jsx
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

/**
 * SetupPage
 * - Holds all setup params and validation.
 * - Keeps inputs typing-friendly (store raw strings; coerce only in validation/request).
 * - Supports policy overrides (by industry & by demographic).
 */

// --- Demographic defaults (now tiered meanIncome to satisfy monotonic check) ---
const getDefaultDemographicParams = (demoLabel) => {
  // Robust detection: works whether Demographic value is "lower class" or a different label.
  const label = String(demoLabel).toLowerCase();
  const meanIncome =
    label.includes("lower") ? 35000 :
    label.includes("middle") ? 55000 :
    90000; // upper (or anything else) fallback

  return {
    meanIncome,
    sdIncome: 15000,
    proportion: 33,
    meanSavings: 10000,
    sdSavings: 5000,
    // UI uses percent; keep as 0–100 number (not decimal fraction).
    unemploymentRate: 5,
    // Flat per-industry spending shares (IndustryType keys)
    GROCERIES: 25,
    UTILITIES: 18,
    AUTOMOBILES: 2,
    HOUSING: 41,
    HOUSEHOLD_GOODS: 8,
    ENTERTAINMENT: 4,
    LUXURY: 2,
  };
};

// --- Industry defaults ---
const getDefaultIndustryParams = () => ({
  startingInventory: 1000,
  startingPrice: 10,
  industrySavings: 50000,
  offeredWage: 15,
});

// --- Small helpers for validation ---
const isBlank = (v) => v === "" || v === null || v === undefined;
const inPctRange = (v) => Number(v) >= 0 && Number(v) <= 100;
const gtZero = (v) => Number(v) > 0;

export default function SetupPage() {
  const navigate = useNavigate();

  const [backendError, setBackendError] = useState(null);

  // Flat, human-readable message list (rendered in the bottom Alert)
  const [formErrors, setFormErrors] = useState({});
  // Field-level flags for red highlights in inputs
  const [inputErrors, setInputErrors] = useState({
    env: {},
    demo: {},
    industry: {},
    policy: {}, // includes nested: policy.byIndustry, policy.byDemographic
  });

  // Prepare empty override objects for all industries/demographics
  const emptyIndustryOverrides = Object.fromEntries(
    Object.keys(IndustryType).map((k) => [k, {}])
  );
  const emptyDemoOverrides = Object.fromEntries(
    Object.values(Demographic).map((k) => [k, {}])
  );

  // --- Central params state ---
  const [params, setParams] = useState({
    envParams: {
      numPeople: 1000,
      maxSimulationLength: 100,
      inflationRate: 1.0, // annual %
      randomEvents: false,
    },

    demoParams: Object.fromEntries(
      Object.values(Demographic).map((value) => [
        value,
        getDefaultDemographicParams(value), // pass label to tier meanIncome
      ])
    ),

    industryParams: Object.fromEntries(
      Object.values(IndustryType).map((value) => [
        value,
        getDefaultIndustryParams(),
      ])
    ),

    policyParams: {
      // Regular/shared values
      salesTax: 7,
      corporateTax: 21,
      personalIncomeTax: 15,
      propertyTax: 10,
      tariffs: 5,
      subsidies: 20,
      rentCap: 20,       // % (changed from $ to %)
      minimumWage: 7.25, // $/hr > 0

      // Advanced overrides
      byIndustry: { ...emptyIndustryOverrides },
      byDemographic: { ...emptyDemoOverrides },
    },
  });

  // --- Validation effect (runs when params change) ---
  useEffect(() => {
    const msgs = {};
    const flags = { env: {}, demo: {}, industry: {}, policy: {} };

    const markDemo = (dk, key) => {
      if (!flags.demo[dk]) flags.demo[dk] = {};
      flags.demo[dk][key] = true;
    };
    const markIndustry = (ik, key) => {
      if (!flags.industry[ik]) flags.industry[ik] = {};
      flags.industry[ik][key] = true;
    };
    const markPolicy = (key) => (flags.policy[key] = true);
    const markPolicyIndustry = (ik, key) => {
      if (!flags.policy.byIndustry) flags.policy.byIndustry = {};
      if (!flags.policy.byIndustry[ik]) flags.policy.byIndustry[ik] = {};
      flags.policy.byIndustry[ik][key] = true;
    };
    const markPolicyDemo = (dk, key) => {
      if (!flags.policy.byDemographic) flags.policy.byDemographic = {};
      if (!flags.policy.byDemographic[dk]) flags.policy.byDemographic[dk] = {};
      flags.policy.byDemographic[dk][key] = true;
    };

    // -- Environmental checks --
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

    // -- Demographics checks --
    const demoOrder = Object.values(Demographic);
    const industryKeys = Object.keys(IndustryType);

    // Proportions must sum to 100 (± rounding)
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

    // Per-demo field validations
    demoOrder.forEach((dk) => {
      const d = params.demoParams[dk];

      if (isBlank(d?.unemploymentRate) || !inPctRange(d?.unemploymentRate)) {
        msgs[`demo_unemp_${dk}`] = `Demographics (${dk}): Unemployment rate must be between 0 and 100.`;
        markDemo(dk, "unemploymentRate");
      }
      if (isBlank(d?.sdIncome) || !gtZero(d?.sdIncome)) {
        msgs[`demo_sdIncome_${dk}`] = `Demographics (${dk}): Income standard deviation must be greater than 0.`;
        markDemo(dk, "sdIncome");
      }
      if (isBlank(d?.sdSavings) || !gtZero(d?.sdSavings)) {
        msgs[`demo_sdSavings_${dk}`] = `Demographics (${dk}): Savings standard deviation must be greater than 0.`;
        markDemo(dk, "sdSavings");
      }
      if (isBlank(d?.meanIncome) || !gtZero(d?.meanIncome)) {
        msgs[`demo_meanIncome_${dk}`] = `Demographics (${dk}): Mean income must be greater than 0.`;
        markDemo(dk, "meanIncome");
      }
      if (isBlank(d?.meanSavings) || Number(d?.meanSavings) < 0) {
        msgs[`demo_meanSavings_${dk}`] = `Demographics (${dk}): Mean savings must be 0 or greater.`;
        markDemo(dk, "meanSavings");
      }

      // Spending shares must sum to ~100%
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

    // Monotonic increasing mean income: demo[i] > demo[i-1]
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

    // -- Industry checks --
    Object.values(IndustryType).forEach((ik) => {
      const ind = params.industryParams[ik];
      if (isBlank(ind?.startingInventory) || !gtZero(ind?.startingInventory)) {
        msgs[`industry_inventory_${ik}`] =
          `Industry (${ik}): Starting inventory must be greater than 0.`;
        markIndustry(ik, "startingInventory");
      }
      if (isBlank(ind?.startingPrice) || !gtZero(ind?.startingPrice)) {
        msgs[`industry_price_${ik}`] =
          `Industry (${ik}): Starting price must be greater than 0.`;
        markIndustry(ik, "startingPrice");
      }
      if (isBlank(ind?.industrySavings) || !gtZero(ind?.industrySavings)) {
        msgs[`industry_savings_${ik}`] =
          `Industry (${ik}): Industry savings must be greater than 0.`;
        markIndustry(ik, "industrySavings");
      }
      if (isBlank(ind?.offeredWage) || !gtZero(ind?.offeredWage)) {
        msgs[`industry_wage_${ik}`] =
          `Industry (${ik}): Offered wage must be greater than 0.`;
        markIndustry(ik, "offeredWage");
      }
    });

    // -- Policies (regular) --
    const p = params.policyParams;
    const pctKeys = [
      ["salesTax", "Sales tax"],
      ["corporateTax", "Corporate income tax"],
      ["personalIncomeTax", "Personal income tax"],
      ["propertyTax", "Property tax"],
      ["tariffs", "Tariffs"],
      ["subsidies", "Subsidies"],
      ["rentCap", "Rent cap"],
    ];
    pctKeys.forEach(([k, label]) => {
      if (isBlank(p?.[k]) || !inPctRange(p?.[k])) {
        msgs[`policy_${k}`] = `Policies: ${label} must be between 0 and 100%.`;
        markPolicy(k);
      }
    });
    if (isBlank(p?.minimumWage) || !gtZero(p?.minimumWage)) {
      msgs.policy_minimumWage = "Policies: Minimum wage must be greater than 0.";
      markPolicy("minimumWage");
    }

    // -- Policies (overrides) : By Industry (percent fields) --
    Object.keys(IndustryType).forEach((ik) => {
      const o = p.byIndustry?.[ik] || {};
      const keys = ["salesTax", "corporateTax", "tariffs", "subsidies", "rentCap"];
      keys.forEach((k) => {
        if (o[k] === "" || o[k] === undefined || o[k] === null) return; // blank means “inherit”
        if (!inPctRange(o[k])) {
          msgs[`policy_byIndustry_${ik}_${k}`] =
            `Policies (by industry ${ik}): ${k} must be between 0 and 100%.`;
          markPolicyIndustry(ik, k);
        }
      });
    });

    // -- Policies (overrides) : By Demographic (personalIncomeTax only) --
    Object.values(Demographic).forEach((dk) => {
      const o = p.byDemographic?.[dk] || {};
      const v = o.personalIncomeTax;
      if (v === "" || v === undefined || v === null) return;
      if (!inPctRange(v)) {
        msgs[`policy_byDemographic_${dk}_personalIncomeTax`] =
          `Policies (by demographic ${dk}): personalIncomeTax must be between 0 and 100%.`;
        markPolicyDemo(dk, "personalIncomeTax");
      }
    });

    setFormErrors(msgs);
    setInputErrors(flags);
  }, [params]);

  // --- Handlers (keep raw strings for typing comfort) ---
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

  // Per-industry override
  const handlePolicyIndustryOverrideChange =
    (industryKey, field) => (event) => {
      const { value } = event.target; // keep raw typing
      setParams((prev) => ({
        ...prev,
        policyParams: {
          ...prev.policyParams,
          byIndustry: {
            ...prev.policyParams.byIndustry,
            [industryKey]: {
              ...prev.policyParams.byIndustry[industryKey],
              [field]: value,
            },
          },
        },
      }));
    };

  // Per-demographic override
  const handlePolicyDemographicOverrideChange =
    (demoKey, field) => (event) => {
      const { value } = event.target;
      setParams((prev) => ({
        ...prev,
        policyParams: {
          ...prev.policyParams,
          byDemographic: {
            ...prev.policyParams.byDemographic,
            [demoKey]: {
              ...prev.policyParams.byDemographic[demoKey],
              [field]: value,
            },
          },
        },
      }));
    };

  // Create model and navigate to simulation view
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
