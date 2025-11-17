// frontend/src/api/payloadBuilder.js
// Transforms frontend state -> backend request payloads (create model / set policies).

import { IndustryType } from "../types/IndustryType.js";
import { Demographic } from "../types/Demographic.js";

/* -------------------------------------------------------------------------- */
/* Small helpers (non-exported)                                               */
/* -------------------------------------------------------------------------- */

function emptyToUndef(v) {
  return v === "" || v === null || v === undefined ? undefined : v;
}
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function pctToDec(v) {
  const n = toNum(v);
  return n === undefined ? undefined : n / 100.0;
}

// Enum conveniences
const INDUSTRY_ENTRIES = Object.entries(IndustryType); // [[ENUM_KEY, "Groceries"], ...]
const INDUSTRY_LABELS  = Object.values(IndustryType);  // ["Groceries", ...]
const DEMO_LABELS      = Object.values(Demographic);

// Backend-required defaults for industries (used if UI fields are absent)
const DEFAULTS = {
  starting_price: 0.0,
  starting_inventory: 200,
  starting_balance: 5000.0,
  starting_offered_wage: 15.0,
  starting_fixed_cost: 200.0,
  starting_raw_mat_cost: 2.0,
  starting_number_of_employees: 5,
  starting_worker_efficiency: 1.0,
  starting_debt_allowed: true,
  starting_demand_intercept: 400.0,
  starting_demand_slope: 1.0,
};

/* -------------------------------------------------------------------------- */
/**
 * Transforms the frontend 'policyParams' to a JSON valid for backend.
 *
 * Notes (added):
 *  - Backend now requires a per-industry `price_cap` map (replaces old `rent_cap`).
 *  - If a toggle is OFF (when policyParams.enabled exists), we send neutral values:
 *      • percentages → 0
 *      • price_cap   → null (meaning "no cap")
 *  - Supports future “Advanced overrides”:
 *      byIndustry[ENUM_KEY].<field> and byDemographic[DEMO_LABEL].personalIncomeTax
 *    If not present, falls back to the global value.
 *
 * @param {object} policyParams
 * @returns {object}
 */
export function buildPoliciesPayload(policyParams = {}) {
  const { enabled = {}, byIndustry = {}, byDemographic = {} } = policyParams;

  // Helper to check if a policy is enabled; default true for backward compatibility.
  const isOn = (k) => (policyParams.enabled ? !!enabled[k] : true);

  // ---- global values (UI stores % as numbers; backend expects decimals) ----
  const corporatePct = pctToDec(policyParams.corporateTax) ?? 0;
  const salesPct     = pctToDec(policyParams.salesTax) ?? 0;
  const tariffsPct   = pctToDec(policyParams.tariffs) ?? 0;
  const subsidiesPct = pctToDec(policyParams.subsidies) ?? 0;
  const personalPct  = pctToDec(policyParams.personalIncomeTax) ?? 0;
  const propertyPct  = pctToDec(policyParams.propertyTax) ?? 0;
  const globalCapUSD = toNum(policyParams.priceCap); // may be undefined

  // Build industry maps with optional overrides (keys must be industry labels)
  const buildIndustryPctMap = (globalPct, field, enabledFlag) =>
    Object.fromEntries(
      INDUSTRY_ENTRIES.map(([enumKey, label]) => {
        // accept overrides keyed by enum key or label (robust to UI shapes)
        const raw =
          byIndustry?.[enumKey]?.[field] ??
          byIndustry?.[label]?.[field];

        const val = raw !== undefined && raw !== "" ? pctToDec(raw) ?? 0 : globalPct;
        return [label, isOn(enabledFlag) ? val : 0];
      })
    );

  // Personal income tax is per-demographic map
  const personalIncomeTaxMap = Object.fromEntries(
    DEMO_LABELS.map((demoLabel) => {
      const raw = byDemographic?.[demoLabel]?.personalIncomeTax;
      const val = raw !== undefined && raw !== "" ? pctToDec(raw) ?? 0 : personalPct;
      return [demoLabel, isOn("personalIncomeTax") ? val : 0];
    })
  );

  // price_cap map (USD). When disabled → null to indicate "no cap".
  const priceCapMap = Object.fromEntries(
    INDUSTRY_ENTRIES.map(([enumKey, label]) => {
      const overrideRaw =
        byIndustry?.[enumKey]?.priceCap ??
        byIndustry?.[label]?.priceCap;
      const val =
        overrideRaw !== undefined && overrideRaw !== ""
          ? toNum(overrideRaw)
          : globalCapUSD;
      return [label, isOn("priceCap") ? (toNum(val) ?? null) : null];
    })
  );

  // Assemble payload expected by backend
  return {
    corporate_income_tax: buildIndustryPctMap(corporatePct, "corporateTax", "corporateTax"),
    personal_income_tax : personalIncomeTaxMap,
    sales_tax           : buildIndustryPctMap(salesPct, "salesTax", "salesTax"),
    property_tax        : isOn("propertyTax") ? propertyPct : 0,
    tariffs             : buildIndustryPctMap(tariffsPct, "tariffs", "tariffs"),
    subsidies           : buildIndustryPctMap(subsidiesPct, "subsidies", "subsidies"),
    price_cap           : priceCapMap,                 // NEW (required)
    minimum_wage        : isOn("minimumWage") ? (toNum(policyParams.minimumWage) ?? 0) : 0,
  };
}

/* -------------------------------------------------------------------------- */
/**
 * Transforms the frontend 'envParams' to a JSON valid for the backend.
 * @param {object} envParams - The envParams object from the frontend state.
 * @returns {object} The environment-related part of the backend payload.
 *
 * Notes:
 *  - UI shows annual % for inflation; backend expects a weekly rate (decimal).
 */
export function buildEnvironmentPayload(envParams = {}) {
  const annual = toNum(envParams.inflationRate) ?? 0;
  const weekly = Math.pow(1 + annual / 100.0, 1 / 52) - 1;

  return {
    max_simulation_length: toNum(envParams.maxSimulationLength) ?? 52,
    num_people: toNum(envParams.numPeople) ?? 0,
    inflation_rate: weekly,
    random_events: !!envParams.randomEvents,
  };
}

/* -------------------------------------------------------------------------- */
/**
 * Transforms the frontend 'demoParams' to a JSON valid for the backend.
 * @param {object} demoParams - The demoParams object from the frontend state.
 * @returns {object} The demographics part of the backend payload.
 */
export function buildDemographicsPayload(demoParams = {}) {
  return Object.fromEntries(
    Object.values(Demographic).map((demoValue) => {
      const d = demoParams[demoValue] || {};

      // Build a dictionary of actual spending behavior per industry (labels as keys)
      const spendingBehaviorDict = Object.fromEntries(
        Object.entries(IndustryType).map(([enumKey, label]) => [
          label,
          pctToDec(d[enumKey]) ?? 0, // convert % to decimal
        ])
      );

      return [
        demoValue,
        {
          income: {
            mean: toNum(d.meanIncome) ?? 0,
            sd: toNum(d.sdIncome) ?? 0,
          },
          proportion: pctToDec(d.proportion) ?? 0,
          unemployment_rate: pctToDec(d.unemploymentRate) ?? 0,
          spending_behavior: spendingBehaviorDict,
          balance: {
            mean: toNum(d.meanSavings) ?? 0,
            sd: toNum(d.sdSavings) ?? 0,
          },
        },
      ];
    })
  );
}

/* -------------------------------------------------------------------------- */
/**
 * Transforms the frontend 'industryParams' to a JSON valid for the backend.
 * @param {object} industryParams - The industryParams object from the frontend state.
 * @returns {object} The industries part of the backend payload.
 *
 * Notes (added):
 *  - Backend creation now validates a full set of **starting_*** keys.
 *  - UI may not expose all of them yet, so we provide sane defaults here.
 *  - Keeps backward compatibility with `industrySavings` (mapped to starting_balance).
 */
export function buildIndustriesPayload(industryParams = {}) {
  return Object.fromEntries(
    Object.entries(industryParams).map(([industryKey, p = {}]) => {
      const out = {
        // Required starting_* fields (some may come from UI; otherwise default)
        starting_price: toNum(p.startingPrice) ?? DEFAULTS.starting_price,
        starting_inventory: Math.trunc(
          toNum(p.startingInventory) ?? DEFAULTS.starting_inventory
        ),
        starting_balance:
          toNum(p.cashBalance ?? p.industrySavings) ?? DEFAULTS.starting_balance,
        starting_offered_wage:
          toNum(p.offeredWage) ?? DEFAULTS.starting_offered_wage,

        // Advanced/operational parameters
        starting_fixed_cost:
          toNum(p.fixedCost) ?? DEFAULTS.starting_fixed_cost,
        starting_raw_mat_cost:
          toNum(p.rawMatCost) ?? DEFAULTS.starting_raw_mat_cost,
        starting_number_of_employees: Math.trunc(
          toNum(p.numberOfEmployees) ?? DEFAULTS.starting_number_of_employees
        ),
        starting_worker_efficiency:
          toNum(p.workerEfficiency) ?? DEFAULTS.starting_worker_efficiency,
        starting_debt_allowed:
          typeof p.debtAllowed === "boolean"
            ? p.debtAllowed
            : DEFAULTS.starting_debt_allowed,

        // Demand curve (linear): P = A − B·Q
        starting_demand_intercept:
          toNum(p.demandIntercept) ?? DEFAULTS.starting_demand_intercept,
        starting_demand_slope:
          toNum(p.demandSlope) ?? DEFAULTS.starting_demand_slope,
      };
      return [industryKey, out];
    })
  );
}

/* -------------------------------------------------------------------------- */
/**
 * Transforms the frontend 'params' state into the JSON payload
 * expected by the backend's ModelCreateRequest.
 * @param {object} params - The 'params' state from SetupPage.jsx
 * @returns {object} The backend-ready payload
 */
export function buildCreatePayload(params = {}) {
  return {
    ...buildEnvironmentPayload(params.envParams || {}),
    demographics: buildDemographicsPayload(params.demoParams || {}),
    industries: buildIndustriesPayload(params.industryParams || {}),
    policies: buildPoliciesPayload(params.policyParams || {}),
  };
}
