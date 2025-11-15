// frontend/src/api/payloadReceiver.js
// Purpose: Convert backend payloads (decimals & label keys) into the frontend
// state shape (percents & enum keys) used by Setup and Policies pages.
//
// Key points:
// - Backend uses decimals (e.g., 0.07) and industry *labels* ("Groceries").
// - Frontend uses percents (e.g., 7) and enum *keys* ("GROCERIES").
// - For per-industry/per-demographic dicts, we treat the *mode* (most common) value
//   as the "global" and anything that differs becomes an override.
//   This avoids the "first item appears blank" artifact.
// - Backend rent_cap is a *scalar*. For UI convenience, we mirror it into the
//   HOUSING override so the Housing field shows a value; the builder will
//   fold it back into the scalar when sending to the backend.

import { IndustryType } from "../types/IndustryType.js";
import { Demographic } from "../types/Demographic.js";

/* --------------------------- Helpers --------------------------- */

/** Map backend industry label ("Groceries") -> enum key ("GROCERIES"). */
function labelToEnumKey(label) {
  for (const [k, v] of Object.entries(IndustryType)) {
    if (v === label) return k;
  }
  return undefined;
}

/** True if two numbers are (almost) equal, within a tolerance. */
function almostEqual(a, b, tol = 1e-12) {
  return Math.abs((a ?? 0) - (b ?? 0)) <= tol;
}

/** Quantize a decimal for grouping by tolerance (used for mode-picking). */
function quantize(x, tol = 1e-9) {
  return Math.round((x ?? 0) / tol) * tol;
}

/** Pick the mode (most frequent) decimal value among a list, by tolerance. */
function pickModeDecimal(values, tol = 1e-9) {
  const counts = new Map();
  for (const v of values) {
    if (v === undefined || v === null) continue;
    const key = quantize(v, tol);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  if (counts.size === 0) return 0;
  let bestKey = null;
  let bestCnt = -1;
  for (const [k, c] of counts) {
    if (c > bestCnt) {
      bestCnt = c;
      bestKey = k;
    }
  }
  return Number(bestKey);
}

/**
 * Convert a per-industry decimal dict (labels -> decimals) into:
 * - global percent (mode of values, or the unique value if all equal)
 * - per-industry overrides (where value differs from global)
 * Returned overrides use enum keys and **percent** units.
 */
function unpackIndustryDictToGlobalAndOverrides(dict, fieldName) {
  const labels = Object.values(IndustryType);
  const vals = labels
    .map((l) => (dict ? dict[l] : undefined))
    .filter((v) => v !== undefined);

  const allEqual = vals.length > 0 && vals.every((v) => almostEqual(v, vals[0]));
  const globalDec = allEqual ? vals[0] : pickModeDecimal(vals);

  const overrides = {};
  for (const label of labels) {
    const dec = dict ? dict[label] : undefined;
    if (dec === undefined) continue;
    if (!almostEqual(dec, globalDec)) {
      const enumKey = labelToEnumKey(label);
      if (!enumKey) continue;
      (overrides[enumKey] ??= {})[fieldName] = dec * 100; // store as percent
    }
  }
  return { globalPct: (globalDec ?? 0) * 100, overrides };
}

/**
 * Convert a per-demographic decimal dict into:
 * - global percent (mode of values, or the unique value if all equal)
 * - per-demographic overrides (where value differs from global)
 * Returned overrides use demographic names and **percent** units.
 */
function unpackDemoDictToGlobalAndOverrides(dict, fieldName) {
  const demos = Object.values(Demographic);
  const vals = demos
    .map((d) => (dict ? dict[d] : undefined))
    .filter((v) => v !== undefined);

  const allEqual = vals.length > 0 && vals.every((v) => almostEqual(v, vals[0]));
  const globalDec = allEqual ? vals[0] : pickModeDecimal(vals);

  const overrides = {};
  for (const d of demos) {
    const dec = dict ? dict[d] : undefined;
    if (dec === undefined) continue;
    if (!almostEqual(dec, globalDec)) {
      (overrides[d] ??= {})[fieldName] = dec * 100; // store as percent
    }
  }
  return { globalPct: (globalDec ?? 0) * 100, overrides };
}

/* ------------------------ Policies receiver ------------------------ */
/**
 * Convert backend policies (decimals & labels) -> frontend policyParams shape:
 * {
 *   salesTax, corporateTax, personalIncomeTax, propertyTax, tariffs, subsidies, rentCap, minimumWage,
 *   byIndustry: { GROCERIES: { ... }, HOUSING: { rentCap: ... }, ... },
 *   byDemographic: { "Lower Class": { personalIncomeTax: ... }, ... }
 * }
 *
 * - Uses "mode-as-global" logic so the first item in a dropdown is not silently treated as the global.
 * - Mirrors scalar rent_cap into HOUSING override so the UI field always shows a value.
 */
export function receivePoliciesPayload(backendPolicies) {
  const p = backendPolicies || {};

  // Per-industry (decimals -> global% + overrides%)
  const sales = unpackIndustryDictToGlobalAndOverrides(p.sales_tax || {}, "salesTax");
  const corp = unpackIndustryDictToGlobalAndOverrides(
    p.corporate_income_tax || {},
    "corporateTax"
  );
  const tariffs = unpackIndustryDictToGlobalAndOverrides(p.tariffs || {}, "tariffs");
  const subsidies = unpackIndustryDictToGlobalAndOverrides(
    p.subsidies || {},
    "subsidies"
  );

  // Merge industry overrides from each policy bucket
  const byIndustry = {};
  const mergeInd = (src) => {
    for (const [k, v] of Object.entries(src)) {
      (byIndustry[k] ??= {});
      Object.assign(byIndustry[k], v);
    }
  };
  mergeInd(sales.overrides);
  mergeInd(corp.overrides);
  mergeInd(tariffs.overrides);
  mergeInd(subsidies.overrides);

  // Per-demographic (decimals -> global% + overrides%)
  const personal = unpackDemoDictToGlobalAndOverrides(
    p.personal_income_tax || {},
    "personalIncomeTax"
  );
  const byDemographic = personal.overrides;

  // Rent cap: backend is a scalar decimal. Mirror into HOUSING override for UI display.
  const rentCapPct = (p.rent_cap ?? 0) * 100;
  (byIndustry.HOUSING ??= {});
  byIndustry.HOUSING.rentCap = rentCapPct;

  return {
    // Globals (percents, except wage)
    salesTax: sales.globalPct,
    corporateTax: corp.globalPct,
    personalIncomeTax: personal.globalPct,
    propertyTax: (p.property_tax ?? 0) * 100,
    tariffs: tariffs.globalPct,
    subsidies: subsidies.globalPct,
    rentCap: rentCapPct,
    minimumWage: p.minimum_wage ?? 0,

    // Overrides (percent units)
    byIndustry,
    byDemographic,
  };
}

/* ------------------- Environment receiver ------------------- */
/**
 * Convert backend environment config into UI shape.
 * - Backend gives weekly decimal inflation rate.
 * - UI expects *annual* percent for display.
 */
export function receiveEnvironmentPayload(backendConfig) {
  return {
    numPeople: backendConfig.num_people,
    inflationRate: ((1 + backendConfig.inflation_rate) ** 52 - 1) * 100, // annual %
  };
}

/* ------------------- Demographics receiver ------------------- */
/**
 * Backend `spending_behavior` keys are industry labels ("Groceries").
 * UI state uses enum keys ("GROCERIES"). Convert labels -> enum keys and decimals -> percents.
 */
export function receiveDemographicsPayload(backendDemographics) {
  return Object.fromEntries(
    Object.values(Demographic).map((demoValue) => {
      const backendDemo = backendDemographics[demoValue];
      if (!backendDemo) return [demoValue, {}];

      // Map label keys to enum keys
      const spendingPercentByEnum = Object.entries(IndustryType).reduce(
        (acc, [enumKey, label]) => {
          const dec = backendDemo.spending_behavior?.[label] ?? 0;
          acc[enumKey] = dec * 100;
          return acc;
        },
        {}
      );

      const frontendDemo = {
        meanIncome: backendDemo.income.mean,
        sdIncome: backendDemo.income.sd,
        proportion: (backendDemo.proportion ?? 0) * 100,
        meanSavings: backendDemo.balance.mean,
        sdSavings: backendDemo.balance.sd,
        unemploymentRate: (backendDemo.unemployment_rate ?? 0) * 100,
        ...spendingPercentByEnum,
      };
      return [demoValue, frontendDemo];
    })
  );
}

/* -------------------- Industries receiver -------------------- */
/**
 * Convert backend industry blocks into UI shape.
 * - For Setup pages, use snake_case keys from the backend.
 * - For non-setup (e.g., live views with different casing), support fallback keys.
 */
export function receiveIndustriesPayload(backendIndustries, isSetup = true) {
  return Object.fromEntries(
    Object.values(IndustryType).map((industryValue) => {
      const backendIndustry = backendIndustries[industryValue];
      if (!backendIndustry) return [industryValue, {}];

      let frontendIndustry = {};
      if (isSetup) {
        frontendIndustry = {
          startingInventory: backendIndustry.inventory,
          startingPrice: backendIndustry.price,
          industrySavings: backendIndustry.balance,
          offeredWage: backendIndustry.offered_wage,
        };
      } else {
        // Fallback mapping if a different casing is returned elsewhere
        frontendIndustry = {
          startingInventory: backendIndustry.Inventory,
          startingPrice: backendIndustry.Price,
          industrySavings: backendIndustry.Balance,
          offeredWage: backendIndustry.Wage,
        };
      }
      return [industryValue, frontendIndustry];
    })
  );
}

/* ------------------------ Template receiver ------------------------ */
/** Assemble a full template from backend -> UI state shape. */
export function receiveTemplatePayload(backendConfig) {
  return {
    envParams: receiveEnvironmentPayload(backendConfig),
    demoParams: receiveDemographicsPayload(backendConfig.demographics),
    industryParams: receiveIndustriesPayload(backendConfig.industries),
    policyParams: receivePoliciesPayload(backendConfig.policies),
  };
}
