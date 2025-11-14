// frontend/src/api/payloadBuilder.js
// Purpose: Convert frontend state (env/demo/industry/policy) into the exact
//          backend payload shape. All user-typed values remain strings in UI
//          for a smooth typing UX; we coerce/normalize them here right before
//          network I/O.

import { IndustryType } from "../types/IndustryType.js";
import { Demographic } from "../types/Demographic.js";

/* ------------------------------------------------------------------
 * Small helpers
 * ------------------------------------------------------------------ */

/**
 * Treat empty-like values as undefined so we can fall back to global defaults.
 * Example: "" -> undefined (means “inherit”),  0 -> 0 (kept)
 */
function emptyToUndef(v) {
  return v === "" || v === null || v === undefined ? undefined : v;
}

/**
 * Safely coerce to a finite number; returns undefined for NaN/Infinity.
 * This prevents accidental "NaN" from leaking into the payload.
 */
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Convert a percent in UI units (e.g., 7 or "7") into a decimal (0.07).
 * Empty-like input yields undefined so callers can decide a default.
 */
function pctToDec(v) {
  const n = toNum(v);
  return n === undefined ? undefined : n / 100.0;
}

/**
 * Normalize an industry identifier into the backend-facing label string.
 *
 * IndustryType typically looks like:
 *   { GROCERIES: "Groceries", UTILITIES: "Utilities", ... }
 *
 * Accepts either:
 *   - enum key (e.g., "GROCERIES")
 *   - label (e.g., "Groceries")
 *   - case-insensitive label (e.g., "groceries")
 * Returns label form (e.g., "Groceries"), or undefined if no match.
 */
function normalizeIndustryLabel(keyOrLabel) {
  if (!keyOrLabel) return undefined;

  // 1) Exact label match
  for (const label of Object.values(IndustryType)) {
    if (label === keyOrLabel) return label;
  }

  // 2) Enum key -> label
  if (IndustryType[keyOrLabel]) {
    return IndustryType[keyOrLabel];
  }

  // 3) Case-insensitive label match (defensive)
  const lower = String(keyOrLabel).toLowerCase();
  for (const label of Object.values(IndustryType)) {
    if (String(label).toLowerCase() === lower) return label;
  }

  return undefined;
}

/**
 * Build a per-industry dict (labels -> decimals) by starting from a global
 * percentage value and applying any per-industry overrides if present.
 *
 * Example UI shape:
 *   byIndustry = {
 *     GROCERIES: { salesTax: "8.25", tariffs: "0" },
 *     HOUSING:   { rentCap: "15" },
 *     ...
 *   }
 */
function buildIndustryPercentDict(globalDec, byIndustry, field) {
  const result = {};

  // Start each industry with the global value (or 0 if undefined).
  for (const label of Object.values(IndustryType)) {
    result[label] = globalDec ?? 0;
  }

  if (!byIndustry) return result;

  // Apply per-industry override if provided and numeric.
  for (const key in byIndustry) {
    const label = normalizeIndustryLabel(key);
    if (!label) continue;

    const raw = emptyToUndef(byIndustry[key]?.[field]);
    const dec = pctToDec(raw);
    if (dec !== undefined) {
      result[label] = dec;
    }
  }

  return result;
}

/**
 * Build a per-demographic dict (labels -> decimals) by starting from a global
 * percentage value and applying any per-demo overrides if present.
 *
 * Example UI shape:
 *   byDemographic = {
 *     "Lower Class":  { personalIncomeTax: "10" },
 *     "Upper Class":  { personalIncomeTax: "18" },
 *   }
 */
function buildDemographicPercentDict(globalDec, byDemo, field) {
  const result = {};

  // Initialize all demographics with the global value (or 0 if undefined).
  for (const demo of Object.values(Demographic)) {
    result[demo] = globalDec ?? 0;
  }

  if (!byDemo) return result;

  // Apply overrides only when supplied and numeric.
  for (const demo of Object.values(Demographic)) {
    const raw = emptyToUndef(byDemo[demo]?.[field]);
    const dec = pctToDec(raw);
    if (dec !== undefined) {
      result[demo] = dec;
    }
  }

  return result;
}

/**
 * Find a rent-cap override specifically for the Housing industry.
 * Supports both enum-keyed ("HOUSING") and label-keyed ("Housing") shapes,
 * and gracefully tolerates case differences.
 */
function getHousingRentCapOverride(byIndustry) {
  if (!byIndustry) return undefined;

  // Known label for Housing from enum (fallback to literal "Housing")
  const housingLabel =
    Object.values(IndustryType).find(
      (v) => String(v).toLowerCase() === "housing"
    ) || "Housing";

  // Prefer enum key if present (e.g., "HOUSING"), otherwise search any key
  // whose normalized label resolves to "Housing".
  const candidateKeys = Object.keys(byIndustry);
  for (const key of candidateKeys) {
    const label = normalizeIndustryLabel(key);
    if (label && String(label).toLowerCase() === "housing") {
      const raw = emptyToUndef(byIndustry[key]?.rentCap);
      const dec = pctToDec(raw);
      if (dec !== undefined) return dec;
    }
  }

  // As an extra fallback, handle direct label indexing if it exists.
  if (byIndustry[housingLabel]) {
    const raw = emptyToUndef(byIndustry[housingLabel]?.rentCap);
    const dec = pctToDec(raw);
    if (dec !== undefined) return dec;
  }

  return undefined;
}

/* ------------------------------------------------------------------
 * Policies payload
 * ------------------------------------------------------------------ */

/**
 * Transform frontend `policyParams` (with optional per-industry and
 * per-demographic overrides) into the backend schema:
 *
 * {
 *   corporate_income_tax: { "<IndustryLabel>": decimal, ... },
 *   personal_income_tax:  { "<DemographicLabel>": decimal, ... },
 *   sales_tax:            { "<IndustryLabel>": decimal, ... },
 *   property_tax:         decimal,
 *   tariffs:              { "<IndustryLabel>": decimal, ... },
 *   subsidies:            { "<IndustryLabel>": decimal, ... },
 *   rent_cap:             decimal,   // NOTE: percent-as-decimal, scalar
 *   minimum_wage:         number     // dollars per hour
 * }
 */
export function buildPoliciesPayload(policyParams) {
  const byIndustry = policyParams?.byIndustry;
  const byDemo = policyParams?.byDemographic;

  // Global percentages as decimals (or undefined if blank).
  const salesTaxDec = pctToDec(policyParams?.salesTax);
  const corpTaxDec = pctToDec(policyParams?.corporateTax);
  const persTaxDec = pctToDec(policyParams?.personalIncomeTax);
  const propertyTaxDec = pctToDec(policyParams?.propertyTax);
  const tariffsDec = pctToDec(policyParams?.tariffs);
  const subsidiesDec = pctToDec(policyParams?.subsidies);
  const rentCapDecGlobal = pctToDec(policyParams?.rentCap); // now a percent -> decimal
  const minimumWage = toNum(policyParams?.minimumWage) ?? 0;

  // Per-industry dicts for percent-based policies.
  const salesTaxDict = buildIndustryPercentDict(salesTaxDec, byIndustry, "salesTax");
  const corpTaxDict  = buildIndustryPercentDict(corpTaxDec,  byIndustry, "corporateTax");
  const tariffsDict  = buildIndustryPercentDict(tariffsDec,  byIndustry, "tariffs");
  const subsidiesDict= buildIndustryPercentDict(subsidiesDec,byIndustry, "subsidies");

  // Rent Cap is a scalar in the backend.
  // If an override for HOUSING exists, prefer it; else fall back to global.
  let rentCapDec = rentCapDecGlobal ?? 0;
  const housingOverride = getHousingRentCapOverride(byIndustry);
  if (housingOverride !== undefined) {
    rentCapDec = housingOverride;
  }

  // Per-demographic dict for personal income tax overrides.
  const personalTaxDict = buildDemographicPercentDict(
    persTaxDec,
    byDemo,
    "personalIncomeTax"
  );

  return {
    corporate_income_tax: corpTaxDict,
    personal_income_tax:  personalTaxDict,
    sales_tax:            salesTaxDict,
    property_tax:         propertyTaxDec ?? 0,
    tariffs:              tariffsDict,
    subsidies:            subsidiesDict,
    rent_cap:             rentCapDec,
    minimum_wage:         minimumWage,
  };
}

/* ------------------------------------------------------------------
 * Environment payload
 * ------------------------------------------------------------------ */

/**
 * Transform frontend `envParams` into the backend format.
 *
 * UI gives `inflationRate` as annual percent (e.g., "5").
 * Backend expects weekly decimal. Conversion:
 *   weekly = (1 + annualPct/100)^(1/52) - 1
 */
export function buildEnvironmentPayload(envParams) {
  const maxSimLength   = toNum(envParams?.maxSimulationLength) ?? 0;
  const numPeople      = toNum(envParams?.numPeople) ?? 0;
  const annualInflPct  = toNum(envParams?.inflationRate) ?? 0;

  const weeklyInflation = (1 + annualInflPct / 100) ** (1 / 52) - 1;

  return {
    max_simulation_length: maxSimLength,
    num_people:            numPeople,
    inflation_rate:        weeklyInflation,
    random_events:         !!envParams?.randomEvents, // strict boolean
  };
}

/* ------------------------------------------------------------------
 * Demographics payload
 * ------------------------------------------------------------------ */

/**
 * Transform frontend `demoParams` into the backend format.
 *
 * UI stores by Demographic label (e.g., "Lower Class"), each with:
 *   - meanIncome, sdIncome
 *   - proportion (0–100 UI percent)
 *   - unemploymentRate (0–100 UI percent)
 *   - meanSavings, sdSavings
 *   - spending behavior per industry keyed by IndustryType enum key
 *
 * Backend expects:
 *   {
 *     "<DemographicLabel>": {
 *       income: { mean, sd },
 *       proportion: decimal,             // 0.33
 *       unemployment_rate: decimal,      // 0.05
 *       spending_behavior: { "<IndustryLabel>": decimal, ... },
 *       balance: { mean, sd },
 *     },
 *     ...
 *   }
 */
export function buildDemographicsPayload(demoParams) {
  return Object.fromEntries(
    Object.values(Demographic).map((demoValue) => {
      const d = demoParams[demoValue] || {};

      // Build spending behavior dict with backend labels (e.g., "Groceries").
      const spendingBehaviorDict = Object.entries(IndustryType).reduce(
        (acc, [enumKey, label]) => {
          const pct = toNum(d[enumKey]);     // UI stores as 0–100
          acc[label] = (pct ?? 0) / 100.0;    // convert to 0–1
          return acc;
        },
        {}
      );

      const backendDemoData = {
        income: {
          mean: toNum(d.meanIncome) ?? 0,
          sd:   toNum(d.sdIncome) ?? 0,
        },
        proportion:         (toNum(d.proportion) ?? 0) / 100.0,
        unemployment_rate:  (toNum(d.unemploymentRate) ?? 0) / 100.0,
        spending_behavior:  spendingBehaviorDict,
        balance: {
          mean: toNum(d.meanSavings) ?? 0,
          sd:   toNum(d.sdSavings) ?? 0,
        },
      };

      return [demoValue, backendDemoData];
    })
  );
}

/* ------------------------------------------------------------------
 * Industries payload
 * ------------------------------------------------------------------ */

/**
 * Transform frontend `industryParams` into the backend format.
 *
 * UI shape (per industry label key, e.g., "Groceries"):
 *   {
 *     startingPrice: "...",
 *     startingInventory: "...",
 *     industrySavings: "...",
 *     offeredWage: "...",
 *   }
 *
 * Backend expects (same label keys):
 *   {
 *     price,
 *     inventory,
 *     balance,
 *     offered_wage,
 *   }
 */
export function buildIndustriesPayload(industryParams) {
  return Object.fromEntries(
    Object.entries(industryParams).map(([industryKey, industryData]) => {
      const backendIndustryData = {
        price:        toNum(industryData.startingPrice) ?? 0,
        inventory:    toNum(industryData.startingInventory) ?? 0,
        balance:      toNum(industryData.industrySavings) ?? 0,
        offered_wage: toNum(industryData.offeredWage) ?? 0,
      };
      // IMPORTANT: industryKey is already a label (e.g., "Groceries")
      // because SetupPage uses Object.values(IndustryType) as keys.
      return [industryKey, backendIndustryData];
    })
  );
}

/* ------------------------------------------------------------------
 * Full ModelCreateRequest payload
 * ------------------------------------------------------------------ */

/**
 * Compose the full payload expected by the backend's ModelCreateRequest.
 * This function is the single entry point used before POST /models/create.
 */
export function buildCreatePayload(params) {
  return {
    ...buildEnvironmentPayload(params.envParams),
    demographics: buildDemographicsPayload(params.demoParams),
    industries:   buildIndustriesPayload(params.industryParams),
    policies:     buildPoliciesPayload(params.policyParams),
  };
}
