// frontend/src/api/payloadReceiver.js
// Transforms backend payloads -> frontend state shape used by Setup / Policies UI.

import { IndustryType } from "../types/IndustryType.js";
import { Demographic } from "../types/Demographic.js";

/* ---------------------------- Small helpers ---------------------------- */

const INDUSTRY_ENTRIES = Object.entries(IndustryType); // [[ENUM, "Groceries"], ...]
const LABEL_TO_ENUM = Object.fromEntries(
  INDUSTRY_ENTRIES.map(([k, v]) => [v, k])
);

/** True if any industry value in dict is a positive number. */
function anyPositiveIndustry(dict) {
  if (!dict || typeof dict !== "object") return false;
  return Object.values(IndustryType).some((label) => Number(dict[label] ?? 0) > 0);
}

/** True if any demographic value in dict is a positive number. */
function anyPositiveDemo(dict) {
  if (!dict || typeof dict !== "object") return false;
  return Object.values(Demographic).some((label) => Number(dict[label] ?? 0) > 0);
}

/** Safely get uniform industry policy (first industry label present). */
function getUniformIndustryPolicyValue(policyDict) {
  if (policyDict && typeof policyDict === "object") {
    const firstLabel = Object.values(IndustryType)[0];
    if (firstLabel !== undefined && policyDict[firstLabel] !== undefined) {
      return Number(policyDict[firstLabel]) || 0;
    }
  }
  return 0;
}

/** Safely get uniform demographic policy (first demo label present). */
function getUniformDemographicPolicyValue(policyDict) {
  if (policyDict && typeof policyDict === "object") {
    const firstLabel = Object.values(Demographic)[0];
    if (firstLabel !== undefined && policyDict[firstLabel] !== undefined) {
      return Number(policyDict[firstLabel]) || 0;
    }
  }
  return 0;
}

/* ------------------------ Policies (backend -> UI) ------------------------ */
/**
 * Transform backend policies -> frontend `policyParams` with `enabled` toggles.
 * - Percent maps are turned into percentage points (*100) for global fields.
 * - price_cap (per-industry $ map) is read; we set:
 *    • policyParams.priceCap = first non-zero (fallback 0)
 *    • policyParams.byIndustry[ENUM].priceCap = that industry's $ (blank if 0)
 *    • enabled.priceCap = any industry cap > 0
 */
export function receivePoliciesPayload(backendPolicies) {
  const priceCapDict = backendPolicies?.price_cap || {}; // { "Groceries": 0, ... }

  // Build per-industry overrides object for UI
  const byIndustry = Object.fromEntries(
    INDUSTRY_ENTRIES.map(([enumKey, label]) => {
      const val = Number(priceCapDict[label] ?? 0);
      return [enumKey, { ...(val > 0 ? { priceCap: val } : {}) }];
    })
  );

  // Choose a global priceCap: first non-zero value across industries, else 0.
  let globalPriceCap = 0;
  for (const label of Object.values(IndustryType)) {
    const v = Number(priceCapDict[label] ?? 0);
    if (v > 0) {
      globalPriceCap = v;
      break;
    }
  }

  const frontendPolicies = {
    corporateTax:
      getUniformIndustryPolicyValue(backendPolicies?.corporate_income_tax) * 100,
    salesTax: getUniformIndustryPolicyValue(backendPolicies?.sales_tax) * 100,
    tariffs: getUniformIndustryPolicyValue(backendPolicies?.tariffs) * 100,
    subsidies: getUniformIndustryPolicyValue(backendPolicies?.subsidies) * 100,

    personalIncomeTax:
      getUniformDemographicPolicyValue(backendPolicies?.personal_income_tax) * 100,

    propertyTax: Number(backendPolicies?.property_tax ?? 0) * 100,
    minimumWage: Number(backendPolicies?.minimum_wage ?? 0),

    // UI field & overrides
    priceCap: globalPriceCap,
    byIndustry,            // include priceCap overrides if any
    byDemographic: {},     // (frontend still only overrides personal income tax; fill on-demand)
  };

  // Build enabled toggles
  frontendPolicies.enabled = {
    corporateTax: anyPositiveIndustry(backendPolicies?.corporate_income_tax),
    salesTax: anyPositiveIndustry(backendPolicies?.sales_tax),
    tariffs: anyPositiveIndustry(backendPolicies?.tariffs),
    subsidies: anyPositiveIndustry(backendPolicies?.subsidies),
    personalIncomeTax: anyPositiveDemo(backendPolicies?.personal_income_tax),
    propertyTax: Number(backendPolicies?.property_tax ?? 0) > 0,
    minimumWage: Number(backendPolicies?.minimum_wage ?? 0) > 0,
    priceCap: Object.values(priceCapDict).some((v) => Number(v) > 0),
  };

  return frontendPolicies;
}

/* -------------------- Environment (backend -> UI) -------------------- */
export function receiveEnvironmentPayload(backendConfig) {
  const weekly = Number(backendConfig?.inflation_rate ?? 0);
  const annualPct = ((1 + weekly) ** 52 - 1) * 100;
  return {
    numPeople: Number(backendConfig?.num_people ?? 0),
    inflationRate: annualPct,
  };
}

/* -------------------- Demographics (backend -> UI) -------------------- */
export function receiveDemographicsPayload(backendDemographics) {
  return Object.fromEntries(
    Object.values(Demographic).map((demoValue) => {
      const backendDemo = backendDemographics?.[demoValue];
      if (!backendDemo) return [demoValue, {}];

      const spendingPairs = Object.entries(backendDemo.spending_behavior ?? {}).map(
        ([industryLabel, v]) => [industryLabel, Number(v || 0) * 100]
      );

      const frontendDemo = {
        meanIncome: Number(backendDemo.income?.mean ?? 0),
        sdIncome: Number(backendDemo.income?.sd ?? 0),
        proportion: Number(backendDemo.proportion ?? 0) * 100,
        meanSavings: Number(backendDemo.balance?.mean ?? 0),
        sdSavings: Number(backendDemo.balance?.sd ?? 0),
        unemploymentRate: Number(backendDemo.unemployment_rate ?? 0) * 100,
        ...Object.fromEntries(spendingPairs),
      };
      return [demoValue, frontendDemo];
    })
  );
}

/* ---------------------- Industries (backend -> UI) ---------------------- */
export function receiveIndustriesPayload(backendIndustries, isSetup = true) {
  return Object.fromEntries(
    Object.values(IndustryType).map((industryLabel) => {
      const b = backendIndustries?.[industryLabel];
      if (!b) return [industryLabel, {}];

      const inv = b.starting_inventory ?? b.inventory;
      const price = b.starting_price ?? b.price;
      const bal = b.starting_balance ?? b.balance;
      const wage = b.starting_offered_wage ?? b.offered_wage;

      const frontend = isSetup
        ? {
            startingInventory: Number(inv ?? 0),
            startingPrice: Number(price ?? 0),
            industrySavings: Number(bal ?? 0),
            offeredWage: Number(wage ?? 0),
          }
        : {
            startingInventory: Number(b.Inventory ?? inv ?? 0),
            startingPrice: Number(b.Price ?? price ?? 0),
            industrySavings: Number(b.Balance ?? bal ?? 0),
            offeredWage: Number(b.Wage ?? wage ?? 0),
          };

      return [industryLabel, frontend];
    })
  );
}

/* ------------------------ Whole template (backend -> UI) ------------------------ */
export function receiveTemplatePayload(backendConfig) {
  return {
    envParams: receiveEnvironmentPayload(backendConfig),
    demoParams: receiveDemographicsPayload(backendConfig.demographics || {}),
    industryParams: receiveIndustriesPayload(backendConfig.industries || {}, true),
    policyParams: receivePoliciesPayload(backendConfig.policies || {}),
  };
}
