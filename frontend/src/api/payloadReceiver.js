import { IndustryType } from "../types/IndustryType.js";
import { Demographic } from "../types/Demographic.js";
import { IndustryMetrics } from "../types/IndustryMetrics.js";
import { DemoMetrics } from "../types/DemographicMetrics.js";

function decimalToPercent(decimal) {
  return decimal * 100;
}

/**
 * Transforms a weekly compounding decimal rate to an annual percentage.
 *
 * @param {number} weeklyDecimal - Weekly compounding rate as a decimal.
 * @returns {number} Annual rate in percent (0–100).
 */
function weeklyDecimaltoAnnualPercent(weeklyDecimal) {
  return decimalToPercent((1 + weeklyDecimal) ** 52 - 1);
}

function weeklyWageToHourly(weeklyWage) {
  return weeklyWage / 40;
}

function weeklyWagetoAnnual(weeklyWage) {
  return weeklyWage * 52;
}

/**
 * Helper to pick a single representative value from an industry-specific
 * policy dictionary.
 *
 * Used to pre-populate the "global" sliders when the backend only provides
 * per-industry values. We simply take the value for the first IndustryType.
 *
 * @param {object} policyDict - Backend dictionary keyed by IndustryType.
 * @returns {number} A representative value (or 0 as a fallback).
 */
const getUniformIndustryPolicyValue = (policyDict) => {
  if (typeof policyDict === "object" && policyDict !== null) {
    const industryKeys = Object.values(IndustryType);
    if (industryKeys.length > 0 && policyDict[industryKeys[0]] !== undefined) {
      return policyDict[industryKeys[0]];
    }
  }
  // Fallback if the structure is unexpected or empty
  return 0;
};

/**
 * Helper: backend dict of decimals -> frontend dict of percent strings.
 * Converts values for every industry to "xx.xx" percent strings.
 *
 * @param {object} backendDict - Backend dictionary keyed by IndustryType.
 * @returns {object} Frontend dictionary of percent strings.
 */
const buildFrontendIndustryPercentDict = (backendDict) => {
  const safeDict =
    typeof backendDict === "object" && backendDict !== null ? backendDict : {};

  return Object.fromEntries(
    Object.values(IndustryType).map((industry) => {
      const raw = safeDict[industry] ?? 0;
      return [industry, decimalToPercent(raw).toFixed(2)];
    })
  );
};

/**
 * Helper: backend dict of weekly decimals -> frontend dict of annual percent strings.
 * Used for policies expressed as weekly compounding rates (e.g., price caps).
 *
 * @param {object} backendDict - Backend dictionary keyed by IndustryType.
 * @returns {object} Frontend dictionary of annual percent strings.
 */
const buildFrontendIndustryWeeklyPercentDict = (backendDict) => {
  const safeDict =
    typeof backendDict === "object" && backendDict !== null ? backendDict : {};

  return Object.fromEntries(
    Object.values(IndustryType).map((industry) => {
      const raw = safeDict[industry] ?? 0;
      return [industry, weeklyDecimaltoAnnualPercent(raw).toFixed(2)];
    })
  );
};

/**
 * Helper: backend dict of booleans -> frontend dict of booleans.
 *
 * @param {object} backendDict - Backend dictionary keyed by IndustryType.
 * @returns {object} Frontend dictionary of booleans.
 */
const buildFrontendIndustryBooleanDict = (backendDict) => {
  const safeDict =
    typeof backendDict === "object" && backendDict !== null ? backendDict : {};

  return Object.fromEntries(
    Object.values(IndustryType).map((industry) => [
      industry,
      Boolean(safeDict[industry]),
    ])
  );
};

/**
 * Transforms the policies received from the backend to a format used by the frontend.
 * This function reverses the logic of `buildPoliciesPayload`.
 *
 * Specifically:
 *  - Per-industry policy dictionaries (corporate_income_tax, sales_tax, tariffs,
 *    subsidies, price_cap, price_cap_enabled) are split into:
 *      * A single "global" scalar value for the main sliders.
 *      * A `...ByIndustry` dictionary for the advanced per-industry overrides.
 *  - Weekly decimal rates are converted into annual percent strings.
 *  - Personal income tax brackets and (optionally) demographic-specific PIT
 *    are converted into the frontend PIT bracket arrays.
 *
 * @param {object} backendPolicies - The policies object received from the backend.
 * @returns {object} The policies object formatted for the frontend's policyParams state.
 */
export function receivePoliciesPayload(backendPolicies) {
  const frontendPolicies = {};

  /**
   * Helper to transform a backend PIT list (weekly thresholds/decimals)
   * into the frontend format (annual salary and annual percent strings).
   *
   * @param {Array} backendList - Backend PIT brackets.
   * @returns {Array} Frontend PIT brackets.
   */
  const transformBackendPITList = (backendList = []) =>
    backendList.map((bracket) => ({
      threshold: weeklyWagetoAnnual(bracket.threshold).toFixed(2),
      rate: weeklyDecimaltoAnnualPercent(bracket.rate).toFixed(2),
    }));

  // --- Corporate income tax (global + per-industry overrides) ---
  frontendPolicies.corporateTax = decimalToPercent(
    getUniformIndustryPolicyValue(backendPolicies.corporate_income_tax)
  ).toFixed(2);
  frontendPolicies.corporateTaxByIndustry = buildFrontendIndustryPercentDict(
    backendPolicies.corporate_income_tax
  );

  // --- Personal income tax (global PIT brackets) ---
  const backendPersonalIncomeTax = backendPolicies.personal_income_tax || [];
  frontendPolicies.personalIncomeTax = transformBackendPITList(
    backendPersonalIncomeTax
  );

  // --- Personal income tax by demographic (optional from backend) ---
  const demoValues = Object.values(Demographic);
  const backendPITByDemo = backendPolicies.personal_income_tax_by_demographic;

  if (backendPITByDemo && typeof backendPITByDemo === "object") {
    // Backend provides demographic-specific PIT; use those when available,
    // and fall back to the global PIT list if a demographic is missing.
    frontendPolicies.personalIncomeTaxByDemographic = Object.fromEntries(
      demoValues.map((demo) => {
        const listForDemo =
          backendPITByDemo[demo] || backendPersonalIncomeTax || [];
        return [demo, transformBackendPITList(listForDemo)];
      })
    );
  } else {
    // Backend does not provide demographic-specific PIT:
    // copy the global PIT list to every demographic.
    frontendPolicies.personalIncomeTaxByDemographic = Object.fromEntries(
      demoValues.map((demo) => [
        demo,
        frontendPolicies.personalIncomeTax.map((b) => ({ ...b })),
      ])
    );
  }

  // --- Sales tax (global + per-industry overrides) ---
  frontendPolicies.salesTax = decimalToPercent(
    getUniformIndustryPolicyValue(backendPolicies.sales_tax)
  ).toFixed(2);
  frontendPolicies.salesTaxByIndustry = buildFrontendIndustryPercentDict(
    backendPolicies.sales_tax
  );

  // NOTE: frontend currently uses a single propertyTax slider,
  // so we take the residential rate as the representative value.
  frontendPolicies.propertyTax = decimalToPercent(
    backendPolicies.property_tax.residential
  ).toFixed(2);

  // --- Tariffs ---
  frontendPolicies.tariffs = decimalToPercent(
    getUniformIndustryPolicyValue(backendPolicies.tariffs)
  ).toFixed(2);
  frontendPolicies.tariffsByIndustry = buildFrontendIndustryPercentDict(
    backendPolicies.tariffs
  );

  // --- Subsidies ---
  frontendPolicies.subsidies = decimalToPercent(
    getUniformIndustryPolicyValue(backendPolicies.subsidies)
  ).toFixed(2);
  frontendPolicies.subsidiesByIndustry = buildFrontendIndustryPercentDict(
    backendPolicies.subsidies
  );

  // --- Price cap (weekly decimal -> annual %) ---
  frontendPolicies.priceCap = weeklyDecimaltoAnnualPercent(
    getUniformIndustryPolicyValue(backendPolicies.price_cap)
  ).toFixed(2);
  frontendPolicies.priceCapByIndustry = buildFrontendIndustryWeeklyPercentDict(
    backendPolicies.price_cap
  );

  // --- Price cap enabled (boolean) ---
  frontendPolicies.priceCapEnabled = Boolean(
    getUniformIndustryPolicyValue(backendPolicies.price_cap_enabled)
  );
  frontendPolicies.priceCapEnabledByIndustry = buildFrontendIndustryBooleanDict(
    backendPolicies.price_cap_enabled
  );

  // --- Minimum wage (weekly -> hourly) ---
  frontendPolicies.minimumWage = weeklyWageToHourly(
    backendPolicies.minimum_wage
  ).toFixed(2);

  return frontendPolicies;
}

/**
 * Transforms the environmental parameters from the backend into the format
 * expected by the frontend's envParams state.
 *
 * @param {object} backendConfig - The full configuration object from the backend.
 * @returns {object} The envParams object for the frontend.
 */
export function receiveEnvironmentPayload(backendConfig) {
  return {
    numPeople: backendConfig.num_people,
    inflationRate: weeklyDecimaltoAnnualPercent(
      backendConfig.inflation_rate
    ).toFixed(2),
    // Note: maxSimulationLength is not part of the template,
    // so it will retain its original value in SetupPage.
  };
}

/**
 * Transforms the population parameters from the backend into the format
 * expected by the frontend's populationParams state.
 *
 * @param {object} backendPopulation - The population object from the backend config.
 * @param {boolean} isSetup - whether this is for setting up, or for something else.
 * @returns {object} The populationParams object for the frontend.
 */
export function receivePopulationPayload(backendPopulation, isSetup = true) {
  if (isSetup) {
    const backendSpending = backendPopulation.spending_behaviors || {};

    const spendingBehaviors = Object.fromEntries(
      Object.values(Demographic).map((demoValue) => {
        const demoSpending = backendSpending[demoValue] || {};
        const frontendSpending = Object.fromEntries(
          Object.entries(demoSpending).map(([industryKey, value]) => [
            industryKey,
            decimalToPercent(value).toFixed(2),
          ])
        );
        return [demoValue, frontendSpending];
      })
    );

    return {
      incomeMean: backendPopulation.income_mean,
      incomeStd: backendPopulation.income_std,
      balanceMean: backendPopulation.balance_mean,
      balanceStd: backendPopulation.balance_std,
      spendingBehaviors: spendingBehaviors,
    };
  }

  // not isSetup
  return Object.fromEntries(
    Object.values(Demographic).map((demoValue) => {
      const backendDemo = backendData[demoValue];
      if (!backendDemo) return [demoValue, {}];

      return [
        demoValue,
        {
          meanIncome: backendDemo[DemoMetrics.AVERAGE_WAGE].toFixed(2),
          sdIncome: backendDemo[DemoMetrics.STD_WAGE].toFixed(2),
          proportion: decimalToPercent(
            backendDemo[DemoMetrics.PROPORTION]
          ).toFixed(2),
          meanSavings: backendDemo[DemoMetrics.AVERAGE_BALANCE].toFixed(2),
          sdSavings: backendDemo[DemoMetrics.STD_BALANCE].toFixed(2),
        },
      ];
    })
  );
}

/**
 * Transforms the industry parameters from the backend into the format
 * expected by the frontend's industryParams state.
 *
 * @param {object} backendIndustries - The industries object from the backend config.
 * @param {boolean} isSetup - Whether this is for initial setup or for an in-flight model.
 * @returns {object} The industryParams object for the frontend.
 */
export function receiveIndustriesPayload(backendIndustries, isSetup = true) {
  return Object.fromEntries(
    Object.values(IndustryType).map((industryValue) => {
      const backendIndustry = backendIndustries[industryValue];
      if (!backendIndustry) return [industryValue, {}];

      let frontendIndustry = {};
      if (isSetup) {
        frontendIndustry = {
          startingInventory: backendIndustry.starting_inventory,
          startingPrice: parseFloat(backendIndustry.starting_price.toFixed(2)),
          industrySavings: parseFloat(
            backendIndustry.starting_balance.toFixed(2)
          ),
          offeredWage: weeklyWageToHourly(
            backendIndustry.starting_offered_wage
          ).toFixed(2),
          startingFixedCost: backendIndustry.starting_fixed_cost,
          startingMaterialCost: backendIndustry.starting_raw_mat_cost,
          startingNumEmployees: backendIndustry.starting_number_of_employees,
          startingEmpEfficiency: backendIndustry.starting_worker_efficiency,
          startingDebtAllowed: backendIndustry.starting_debt_allowed,
        };
      } else {
        frontendIndustry = {
          startingInventory: backendIndustry.Inventory,
          startingPrice: backendIndustry[IndustryMetrics.PRICE].toFixed(2),
          industrySavings: backendIndustry[IndustryMetrics.BALANCE].toFixed(2),
          offeredWage: weeklyWageToHourly(
            backendIndustry[IndustryMetrics.WAGE]
          ).toFixed(2),
          startingNumEmployees: backendIndustry[IndustryMetrics.NUM_EMPLOYEES],
        };
      }

      return [industryValue, frontendIndustry];
    })
  );
}

/**
 * Transforms a full template configuration from the backend into the format
 * expected by the frontend's SetupPage `params` state.
 *
 * @param {object} backendConfig - The configuration object from the backend.
 * @returns {object} The configuration formatted for the frontend state.
 */
export function receiveTemplatePayload(backendConfig) {
  return {
    envParams: receiveEnvironmentPayload(backendConfig),
    populationParams: receivePopulationPayload(backendConfig.population),
    industryParams: receiveIndustriesPayload(backendConfig.industries),
    policyParams: receivePoliciesPayload(backendConfig.policies),
  };
}
