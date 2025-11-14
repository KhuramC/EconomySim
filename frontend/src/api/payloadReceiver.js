// frontend/src/api/payloadReceiver.js
import { IndustryType } from "../types/IndustryType.js";
import { Demographic } from "../types/Demographic.js";

/* ========================================================================
 * Helpers
 * ===================================================================== */

/** Map backend industry label ("Groceries") -> enum key ("GROCERIES"). */
function labelToEnumKey(label) {
  for (const [k, v] of Object.entries(IndustryType)) {
    if (v === label) return k;
  }
  return undefined; // unknown label (shouldn't happen with valid backend data)
}

/** Return true if two numbers are approximately equal (for float noise). */
function almostEqual(a, b, tol = 1e-12) {
  return Math.abs((a ?? 0) - (b ?? 0)) <= tol;
}

/**
 * From an industry policy dict (labels -> decimals), derive:
 *  - global percent value (take the first defined entry as the "global")
 *  - per-industry overrides (percent) for entries that differ from the global
 *
 * Returned structure:
 *  {
 *    globalPct: number,                 // percent
 *    overrides: { GROCERIES: {field: %}, ... }  // enum keys, percent
 *  }
 */
function unpackIndustryDictToGlobalAndOverrides(dict, fieldName) {
  const labels = Object.values(IndustryType);

  // Choose the first defined label as the "global" value fallback.
  const firstLabel = labels.find((l) => dict && dict[l] !== undefined);
  const globalDec = firstLabel !== undefined ? dict[firstLabel] : 0;

  const overrides = {};
  for (const label of labels) {
    const dec = dict ? dict[label] : undefined;
    if (dec === undefined) continue;
    if (!almostEqual(dec, globalDec)) {
      const enumKey = labelToEnumKey(label);
      if (!enumKey) continue; // skip unknown label
      if (!overrides[enumKey]) overrides[enumKey] = {};
      overrides[enumKey][fieldName] = dec * 100; // store as PERCENT for UI
    }
  }
  return { globalPct: (globalDec ?? 0) * 100, overrides };
}

/**
 * From a demographic policy dict (demographic -> decimals), derive:
 *  - global percent (first defined)
 *  - per-demographic overrides (percent) for values that differ
 */
function unpackDemoDictToGlobalAndOverrides(dict, fieldName) {
  const demos = Object.values(Demographic);

  const firstDemo = demos.find((d) => dict && dict[d] !== undefined);
  const globalDec = firstDemo !== undefined ? dict[firstDemo] : 0;

  const overrides = {};
  for (const d of demos) {
    const dec = dict ? dict[d] : undefined;
    if (dec === undefined) continue;
    if (!almostEqual(dec, globalDec)) {
      if (!overrides[d]) overrides[d] = {};
      overrides[d][fieldName] = dec * 100; // store as PERCENT for UI
    }
  }
  return { globalPct: (globalDec ?? 0) * 100, overrides };
}

/* ========================================================================
 * Policies receiver (backend -> frontend policyParams)
 * ===================================================================== */
/**
 * Convert backend policies (decimals & label keys) into the UI shape:
 *
 * {
 *   // globals (percents; wage is raw number):
 *   salesTax, corporateTax, personalIncomeTax, propertyTax, tariffs, subsidies, rentCap, minimumWage,
 *
 *   // overrides (enum-keyed, percent values):
 *   byIndustry: {
 *     GROCERIES: { salesTax?, corporateTax?, tariffs?, subsidies?, rentCap? }, ...
 *   },
 *   byDemographic: {
 *     "lower class": { personalIncomeTax? }, ...
 *   }
 * }
 */
export function receivePoliciesPayload(backendPolicies) {
  const p = backendPolicies || {};

  // Per-industry policies (decimals in backend)
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

  // Merge all industry overrides into one object (enum-keyed)
  const byIndustry = {};
  const mergeInd = (src) => {
    for (const [k, v] of Object.entries(src)) {
      if (!byIndustry[k]) byIndustry[k] = {};
      Object.assign(byIndustry[k], v);
    }
  };
  mergeInd(sales.overrides);
  mergeInd(corp.overrides);
  mergeInd(tariffs.overrides);
  mergeInd(subsidies.overrides);

  // Per-demographic policy (personal income tax only; decimals in backend)
  const personal = unpackDemoDictToGlobalAndOverrides(
    p.personal_income_tax || {},
    "personalIncomeTax"
  );
  const byDemographic = personal.overrides;

  // Rent cap is a single decimal in backend (now percent semantics globally)
  const rentCapPct = (p.rent_cap ?? 0) * 100;

  return {
    // Global fields (UI uses percents; wage is unit value)
    salesTax: sales.globalPct,
    corporateTax: corp.globalPct,
    personalIncomeTax: personal.globalPct,
    propertyTax: (p.property_tax ?? 0) * 100,
    tariffs: tariffs.globalPct,
    subsidies: subsidies.globalPct,
    rentCap: rentCapPct,
    minimumWage: p.minimum_wage ?? 0,

    // Overrides (enum-keyed for industries; demographic names for demos)
    byIndustry,
    byDemographic,
  };
}

/* ========================================================================
 * Environment receiver (backend -> UI envParams)
 * ===================================================================== */
/**
 * Backend provides weekly decimal; UI expects annual percent.
 * Conversion: annual = ((1 + weekly) ** 52 - 1) * 100
 */
export function receiveEnvironmentPayload(backendConfig) {
  return {
    numPeople: backendConfig.num_people,
    inflationRate: ((1 + backendConfig.inflation_rate) ** 52 - 1) * 100,
  };
}

/* ========================================================================
 * Demographics receiver (backend -> UI demoParams)
 * ===================================================================== */
/**
 * Backend spending_behavior keys are industry LABELS ("Groceries").
 * UI stores by enum keys ("GROCERIES"). Convert labels->enum keys and
 * decimals->percents for the sliders/inputs.
 */
export function receiveDemographicsPayload(backendDemographics) {
  return Object.fromEntries(
    Object.values(Demographic).map((demoValue) => {
      const backendDemo = backendDemographics[demoValue];
      if (!backendDemo) return [demoValue, {}]; // defensive (invalid template)

      // Map label-keyed decimals -> enum-keyed percents
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

/* ========================================================================
 * Industries receiver (backend -> UI industryParams)
 * ===================================================================== */
/**
 * If `isSetup` is false, accept capitalized keys (e.g., from indicators).
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
        // Fallback mapping when coming from model indicators (capitalized keys)
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

/* ========================================================================
 * Template receiver (backend -> UI aggregate config)
 * ===================================================================== */
export function receiveTemplatePayload(backendConfig) {
  return {
    envParams: receiveEnvironmentPayload(backendConfig),
    demoParams: receiveDemographicsPayload(backendConfig.demographics),
    industryParams: receiveIndustriesPayload(backendConfig.industries),
    policyParams: receivePoliciesPayload(backendConfig.policies),
  };
}
