import { IndustryType } from "../types/IndustryType.js";
import { Demographic } from "../types/Demographic.js";

function percentToDecimal(percent) {
  return percent / 100.0;
}

/**
 * Transforms an annual percentage to a weekly compounding decimal rate.
 *
 * @param {number} annualPercent - Annual rate in percent (0–100).
 * @returns {number} Weekly compounding rate as a decimal.
 */
function annualPercentToWeeklyDecimal(annualPercent) {
  return (1 + percentToDecimal(annualPercent)) ** (1 / 52) - 1;
}

function hourlyWageToWeekly(hourlyWage) {
  return hourlyWage * 40;
}

function annualSalaryToWeekly(annualSalary) {
  return annualSalary / 52;
}

/**
 * Helper to build an industry-specific policy dictionary from:
 *  - a global value field (`globalFieldName`),
 *  - an optional per-industry override dictionary (`fieldName`).
 *
 * If an override exists for a given industry, it is used;
 * otherwise, the global value is used.
 *
 * @param {object} policyParams - Frontend `policyParams` object.
 * @param {string} fieldName - Name of the per-industry overrides field (e.g. "salesTaxByIndustry").
 * @param {string} globalFieldName - Name of the global field (e.g. "salesTax").
 * @param {(number|boolean) => any} transform - Transformer from frontend value to backend value.
 * @returns {object} Backend-ready dictionary keyed by IndustryType.
 */
function buildIndustryPolicyDict(
  policyParams,
  fieldName,
  globalFieldName,
  transform
) {
  const overrides = policyParams[fieldName] || {};
  const globalRaw = policyParams[globalFieldName];

  return Object.fromEntries(
    Object.values(IndustryType).map((industry) => {
      const hasOverride = overrides[industry] !== undefined;
      const rawValue = hasOverride ? overrides[industry] : globalRaw;
      return [industry, transform(rawValue)];
    })
  );
}

/**
 * Transforms the frontend `policyParams` into the JSON payload
 * structure expected by the backend.
 *
 * - Per-industry policies (sales tax, corporate tax, tariffs, subsidies,
 *   price cap, price cap enabled) are built using both:
 *     * global scalar values, and
 *     * per-industry override dictionaries.
 * - Personal income tax is converted from:
 *     * annual salary thresholds and annual percent rates
 *   into:
 *     * weekly thresholds and weekly compounding decimal rates,
 *   and sorted in descending order by threshold (backend expectation).
 * - Demographic-specific personal income tax (if present) is also converted.
 * - Property tax is still treated as a single scalar for both residential
 *   and commercial in the backend.
 *
 * @param {object} policyParams - Frontend `policyParams` state.
 * @returns {object} Backend-ready `policies` payload.
 */
export function buildPoliciesPayload(policyParams) {
  // --- Global + per-industry policies ---
  const policies = {
    corporate_income_tax: buildIndustryPolicyDict(
      policyParams,
      "corporateTaxByIndustry",
      "corporateTax",
      (v) => percentToDecimal(v)
    ),

    sales_tax: buildIndustryPolicyDict(
      policyParams,
      "salesTaxByIndustry",
      "salesTax",
      (v) => percentToDecimal(v)
    ),

    // NOTE: frontend currently uses a single propertyTax slider,
    // so we send the same value as both residential and commercial.
    property_tax: {
      residential: percentToDecimal(policyParams.propertyTax),
      commercial: percentToDecimal(policyParams.propertyTax),
    },

    tariffs: buildIndustryPolicyDict(
      policyParams,
      "tariffsByIndustry",
      "tariffs",
      (v) => percentToDecimal(v)
    ),

    subsidies: buildIndustryPolicyDict(
      policyParams,
      "subsidiesByIndustry",
      "subsidies",
      (v) => percentToDecimal(v)
    ),

    price_cap: buildIndustryPolicyDict(
      policyParams,
      "priceCapByIndustry",
      "priceCap",
      (v) => annualPercentToWeeklyDecimal(v)
    ),

    price_cap_enabled: buildIndustryPolicyDict(
      policyParams,
      "priceCapEnabledByIndustry",
      "priceCapEnabled",
      (v) => Boolean(v)
    ),

    minimum_wage: hourlyWageToWeekly(policyParams.minimumWage),
  };

  // --- Global personal income tax brackets ---
  policies.personal_income_tax = policyParams.personalIncomeTax
    .map((bracket) => ({
      threshold: annualSalaryToWeekly(bracket.threshold),
      rate: annualPercentToWeeklyDecimal(bracket.rate),
    }))
    // Backend expects brackets sorted by threshold in descending order
    .sort((a, b) => b.threshold - a.threshold);

  // --- Optional: demographic-specific personal income tax ---
  if (
    policyParams.personalIncomeTaxByDemographic &&
    typeof policyParams.personalIncomeTaxByDemographic === "object"
  ) {
    policies.personal_income_tax_by_demographic = Object.fromEntries(
      Object.values(Demographic).map((demo) => {
        const demoBrackets =
          policyParams.personalIncomeTaxByDemographic[demo] ||
          policyParams.personalIncomeTax ||
          [];

        const converted = demoBrackets
          .map((bracket) => ({
            threshold: annualSalaryToWeekly(bracket.threshold),
            rate: annualPercentToWeeklyDecimal(bracket.rate),
          }))
          .sort((a, b) => b.threshold - a.threshold);

        return [demo, converted];
      })
    );
  }

  return policies;
}

/**
 * Transforms the frontend `envParams` to a JSON object
 * valid for the backend environment configuration.
 *
 * @param {object} envParams - The envParams object from the frontend state.
 * @returns {object} The environment-related part of the backend payload.
 */
export function buildEnvironmentPayload(envParams) {
  return {
    max_simulation_length: envParams.maxSimulationLength,
    num_people: envParams.numPeople,
    inflation_rate: annualPercentToWeeklyDecimal(envParams.inflationRate),
  };
}

/**
 * Transforms the frontend `demoParams` to a JSON object
 * valid for the backend demographics configuration.
 *
 * @param {object} demoParams - The demoParams object from the frontend state.
 * @returns {object} The demographics part of the backend payload.
 */
export function buildDemographicsPayload(demoParams) {
  return Object.fromEntries(
    Object.values(Demographic).map((demoValue) => {
      const demoData = demoParams[demoValue];

      // Create a dictionary of spending behavior per industry
      const spendingBehaviorDict = Object.fromEntries(
        Object.values(IndustryType).map((industry) => [
          industry,
          percentToDecimal(Number(demoData[industry]) || 0),
        ])
      );

      const backendDemoData = {
        income: {
          mean: demoData.meanIncome,
          sd: demoData.sdIncome,
        },
        proportion: percentToDecimal(demoData.proportion),
        spending_behavior: spendingBehaviorDict,
        balance: {
          mean: demoData.meanSavings,
          sd: demoData.sdSavings,
        },
      };
      return [demoValue, backendDemoData];
    })
  );
}

/**
 * Transforms the frontend `industryParams` to a JSON object
 * valid for the backend industries configuration.
 *
 * @param {object} industryParams - The industryParams object from the frontend state.
 * @returns {object} The industries part of the backend payload.
 */
export function buildIndustriesPayload(industryParams) {
  return Object.fromEntries(
    Object.entries(industryParams).map(([industryKey, industryData]) => {
      const backendIndustryData = {
        starting_price: industryData.startingPrice,
        starting_inventory: industryData.startingInventory,
        starting_balance: industryData.industrySavings,
        starting_offered_wage: hourlyWageToWeekly(industryData.offeredWage),
        starting_fixed_cost: industryData.startingFixedCost,
        starting_raw_mat_cost: industryData.startingMaterialCost,
        starting_number_of_employees: industryData.startingNumEmployees,
        starting_worker_efficiency: industryData.startingEmpEfficiency,
        starting_debt_allowed: industryData.startingDebtAllowed,
        // TODO: remove demand parameters once the backend no longer requires them.
        starting_demand_intercept: 200,
        starting_demand_slope: 0.01,
      };
      return [industryKey, backendIndustryData];
    })
  );
}

/**
 * Transforms the frontend `params` state into the JSON payload
 * expected by the backend's `ModelCreateRequest`.
 *
 * @param {object} params - The `params` state from SetupPage.jsx.
 * @returns {object} The backend-ready payload.
 */
export function buildCreatePayload(params) {
  const payload = {
    ...buildEnvironmentPayload(params.envParams),
    demographics: buildDemographicsPayload(params.demoParams),
    industries: buildIndustriesPayload(params.industryParams),
    policies: buildPoliciesPayload(params.policyParams),
  };

  return payload;
}
