// frontend/src/api/payloadBuilder.js
// Transforms frontend state -> backend request payloads (create model / set policies).

import { IndustryType } from "../types/IndustryType.js";
import { Demographic } from "../types/Demographic.js";

/* ---------------------------- Small helpers ---------------------------- */

const pct = (v) => (Number(v) || 0) / 100.0; // percent -> decimal
const usd = (v) => Number(v) || 0;           // currency -> number

// Map <ENUM_KEY, Label> (as in types). Build inverse map for lookups if needed.
const INDUSTRY_ENTRIES = Object.entries(IndustryType); // [[ENUM, "Groceries"], ...]
const DEMOS = Object.values(Demographic);

// Default industry constants (mirror backend IndustryAgent defaults)
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

/* ----------------------------- Policies (UI -> backend) ----------------------------- */
/**
 * Build backend policies from UI `policyParams`.
 * Behavior:
 * - If a toggle is OFF, send 0 (disabled) for that policy.
 * - For industry/demographic maps, apply global value and overlay any overrides present in UI.
 * - UI uses `priceCap` ($). Backend expects **price_cap** as a per-industry map (label keys).
 */
export function buildPoliciesPayload(policyParams) {
  const {
    enabled = {},
    byIndustry = {},
    byDemographic = {},
  } = policyParams || {};

  // Read global values (UI percentages are numbers like 7 → 0.07)
  const corporatePct = pct(policyParams.corporateTax);
  const salesPct = pct(policyParams.salesTax);
  const tariffsPct = pct(policyParams.tariffs);
  const subsidiesPct = pct(policyParams.subsidies);
  const personalPct = pct(policyParams.personalIncomeTax);
  const propertyPct = pct(policyParams.propertyTax);
  const globalPriceCapUSD = usd(policyParams.priceCap);

  // Helper to build an industry map with overrides layered on top (keys must be labels).
  const buildIndustryPctMap = (isEnabled, globalPct, field) =>
    Object.fromEntries(
      INDUSTRY_ENTRIES.map(([enumKey, label]) => {
        const raw = byIndustry?.[enumKey]?.[field];
        const vPct =
          raw !== undefined && raw !== "" ? pct(raw) : globalPct;
        return [label, isEnabled ? vPct : 0];
      })
    );

  // Personal Income Tax is per-demographic map (keys are demographic labels)
  const personalIncomeTaxMap = Object.fromEntries(
    DEMOS.map((demoLabel) => {
      const raw = byDemographic?.[demoLabel]?.personalIncomeTax;
      const vPct =
        raw !== undefined && raw !== "" ? pct(raw) : personalPct;
      return [demoLabel, enabled.personalIncomeTax ? vPct : 0];
    })
  );

  // New: price_cap is a per-industry $ map (keys must be labels). If toggle OFF → 0 for all industries.
  const priceCapMap = Object.fromEntries(
    INDUSTRY_ENTRIES.map(([enumKey, label]) => {
      const overrideRaw = byIndustry?.[enumKey]?.priceCap;
      const vUSD =
        overrideRaw !== undefined && overrideRaw !== "" ? usd(overrideRaw) : globalPriceCapUSD;
      return [label, enabled.priceCap ? vUSD : 0];
    })
  );

  // Build payload
  const payload = {
    corporate_income_tax: buildIndustryPctMap(
      !!enabled.corporateTax,
      corporatePct,
      "corporateTax"
    ),
    personal_income_tax: personalIncomeTaxMap,
    sales_tax: buildIndustryPctMap(!!enabled.salesTax, salesPct, "salesTax"),
    property_tax: !!enabled.propertyTax ? propertyPct : 0,
    tariffs: buildIndustryPctMap(!!enabled.tariffs, tariffsPct, "tariffs"),
    subsidies: buildIndustryPctMap(!!enabled.subsidies, subsidiesPct, "subsidies"),

    // IMPORTANT: backend requires 'price_cap' (per-industry map). Do NOT send 'rent_cap'.
    price_cap: priceCapMap,

    minimum_wage: !!enabled.minimumWage ? usd(policyParams.minimumWage) : 0,
  };

  return payload;
}

/* ------------------------- Environment (UI -> backend) ------------------------- */
/**
 * Environment fields used on create.
 * UI shows annual % for inflation; backend expects weekly rate (decimal).
 */
export function buildEnvironmentPayload(envParams) {
  const annualPct = Number(envParams?.inflationRate ?? 0) / 100.0;
  const weekly = (1 + annualPct) ** (1 / 52) - 1;

  return {
    max_simulation_length: Number(envParams?.maxSimulationLength ?? 52),
    num_people: Number(envParams?.numPeople ?? 0),
    inflation_rate: weekly,
    random_events: !!envParams?.randomEvents,
  };
}

/* ------------------------- Demographics (UI -> backend) ------------------------- */
/**
 * Demographics: convert percentages to decimals and flatten spending behavior.
 */
export function buildDemographicsPayload(demoParams) {
  return Object.fromEntries(
    Object.values(Demographic).map((demoValue) => {
      const d = demoParams?.[demoValue] || {};

      // Build spending behavior map per IndustryType label
      const spendingBehaviorDict = Object.fromEntries(
        INDUSTRY_ENTRIES.map(([enumKey, label]) => [
          label,
          pct(d?.[enumKey]),
        ])
      );

      const out = {
        income: {
          mean: Number(d?.meanIncome ?? 0),
          sd: Number(d?.sdIncome ?? 0),
        },
        proportion: pct(d?.proportion),
        unemployment_rate: pct(d?.unemploymentRate),
        spending_behavior: spendingBehaviorDict,
        balance: {
          mean: Number(d?.meanSavings ?? 0),
          sd: Number(d?.sdSavings ?? 0),
        },
      };
      return [demoValue, out];
    })
  );
}

/* -------------------------- Industries (UI -> backend) -------------------------- */
/**
 * Industries for create: backend expects "starting_*" keys PLUS several required fields.
 * We provide sensible defaults (mirroring backend defaults) when the UI doesn't collect them.
 */
export function buildIndustriesPayload(industryParams) {
  return Object.fromEntries(
    Object.entries(industryParams || {}).map(([industryKey, data]) => {
      const d = data || {};
      const out = {
        // Required "starting_*" keys
        starting_price: Number(d.startingPrice ?? DEFAULTS.starting_price),
        starting_inventory: Number(
          d.startingInventory ?? DEFAULTS.starting_inventory
        ),
        starting_balance: Number(
          d.industrySavings ?? DEFAULTS.starting_balance
        ),
        starting_offered_wage: Number(
          d.offeredWage ?? DEFAULTS.starting_offered_wage
        ),

        // Additional required fields (not captured by UI; use defaults)
        starting_fixed_cost: DEFAULTS.starting_fixed_cost,
        starting_raw_mat_cost: DEFAULTS.starting_raw_mat_cost,
        starting_number_of_employees: DEFAULTS.starting_number_of_employees,
        starting_worker_efficiency: DEFAULTS.starting_worker_efficiency,
        starting_debt_allowed: DEFAULTS.starting_debt_allowed,
        starting_demand_intercept: DEFAULTS.starting_demand_intercept,
        starting_demand_slope: DEFAULTS.starting_demand_slope,
      };

      return [industryKey, out];
    })
  );
}

/* --------------------------- Compose create payload --------------------------- */
/**
 * Build the full ModelCreateRequest payload from SetupPage state `params`.
 */
export function buildCreatePayload(params) {
  return {
    ...buildEnvironmentPayload(params?.envParams || {}),
    demographics: buildDemographicsPayload(params?.demoParams || {}),
    industries: buildIndustriesPayload(params?.industryParams || {}),
    policies: buildPoliciesPayload(params?.policyParams || {}),
  };
}
