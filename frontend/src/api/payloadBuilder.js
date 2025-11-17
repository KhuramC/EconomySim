import { IndustryType } from "../types/IndustryType.js";
import { Demographic } from "../types/Demographic.js";

function percentToDecimal(percent) {
  return percent / 100.0;
}

/**
 * Transforms an annual percentage to a weekly decimal rate.
 * @param {object} annualPercent
 * @returns {object}
 */
function annualPercentToWeeklyDecimal(annualPercent) {
  return (1 + percentToDecimal(annualPercent)) ** (1 / 52) - 1;
}

/**
 * Transforms the frontend 'policyParams' to a JSON valid for backend.
 * @param {object} policyParams
 * @returns {object}
 */
export function buildPoliciesPayload(policyParams) {
  // TODO: change this whenever policies are separated by demographics/industry type in the frontend
  const policies = {
    corporate_income_tax: Object.fromEntries(
      Object.values(IndustryType).map((value) => [
        value,
        annualPercentToWeeklyDecimal(policyParams.corporateTax),
      ])
    ),
    personal_income_tax: policyParams.personalIncomeTax
      .map((bracket) => ({
        threshold: bracket.threshold,
        rate: annualPercentToWeeklyDecimal(bracket.rate),
      }))
      .sort((a, b) => b.threshold - a.threshold), // descending order by threshold
    sales_tax: Object.fromEntries(
      Object.values(IndustryType).map((value) => [
        value,
        annualPercentToWeeklyDecimal(policyParams.salesTax),
      ])
    ),
    property_tax: {
      residential: annualPercentToWeeklyDecimal(policyParams.propertyTax),
      commercial: annualPercentToWeeklyDecimal(policyParams.propertyTax),
    },
    tariffs: Object.fromEntries(
      Object.values(IndustryType).map((value) => [
        value,
        annualPercentToWeeklyDecimal(policyParams.tariffs),
      ])
    ),
    subsidies: Object.fromEntries(
      Object.values(IndustryType).map((value) => [
        value,
        annualPercentToWeeklyDecimal(policyParams.subsidies),
      ])
    ),
    price_cap: Object.fromEntries(
      Object.values(IndustryType).map((value) => [
        value,
        annualPercentToWeeklyDecimal(policyParams.priceCap),
      ])
    ),
    minimum_wage: policyParams.minimumWage,
  };
  return policies;
}

/**
 * Transforms the frontend 'envParams' to a JSON valid for the backend.
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
 * Transforms the frontend 'demoParams' to a JSON valid for the backend.
 * @param {object} demoParams - The demoParams object from the frontend state.
 * @returns {object} The demographics part of the backend payload.
 */
export function buildDemographicsPayload(demoParams) {
  return Object.fromEntries(
    Object.values(Demographic).map((demoValue) => {
      const demoData = demoParams[demoValue];
      // Create a dictionary of actual spending behavior per industry
      const spendingBehaviorDict = Object.fromEntries(
        Object.entries(IndustryType).map(([industry, label]) => [
          label,
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
 * Transforms the frontend 'industryParams' to a JSON valid for the backend.
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
        starting_offered_wage: industryData.offeredWage,
        starting_fixed_cost: industryData.startingFixedCost,
        starting_raw_mat_cost: industryData.startingMaterialCost,
        starting_number_of_employees: industryData.startingNumEmployees,
        starting_worker_efficiency: industryData.startingEmpEfficiency,
        starting_debt_allowed: industryData.startingDebtAllowed,
        starting_demand_intercept: 200,
        starting_demand_slope: 0.01,
      }; // TODO: remove demand stuff whenever backend is ready to not need it passed in.
      return [industryKey, backendIndustryData];
    })
  );
}

/**
 * Transforms the frontend 'params' state into the JSON payload
 * expected by the backend's ModelCreateRequest.
 * @param {object} params - The 'params' state from SetupPage.jsx
 * @returns {object} The backend-ready payload
 */
export function buildCreatePayload(params) {
  // Prepare Demographics
  const payload = {
    ...buildEnvironmentPayload(params.envParams),
    demographics: buildDemographicsPayload(params.demoParams),
    industries: buildIndustriesPayload(params.industryParams),
    policies: buildPoliciesPayload(params.policyParams),
  };

  return payload;
}
