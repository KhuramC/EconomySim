import { IndustryType } from "../types/IndustryType.js";
import { Demographic } from "../types/Demographic.js";

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
        policyParams.corporateTax / 100.0,
      ])
    ),
    personal_income_tax: Object.fromEntries(
      Object.values(Demographic).map((value) => [
        value,
        policyParams.personalIncomeTax / 100.0,
      ])
    ),
    sales_tax: Object.fromEntries(
      Object.values(IndustryType).map((value) => [
        value,
        policyParams.salesTax / 100.0,
      ])
    ),
    property_tax: {
      residential: policyParams.propertyTax / 100.0,
      commercial: policyParams.propertyTax / 100.0,
    },
    tariffs: Object.fromEntries(
      Object.values(IndustryType).map((value) => [
        value,
        policyParams.tariffs / 100.0,
      ])
    ),
    subsidies: Object.fromEntries(
      Object.values(IndustryType).map((value) => [
        value,
        policyParams.subsidies / 100.0, // Assuming %
      ])
    ),
    price_cap: Object.fromEntries(
      Object.values(IndustryType).map((value) => [
        value,
        policyParams.priceCap / 100.0, // Assuming %
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
    inflation_rate: (1 + envParams.inflationRate / 100) ** (1 / 52) - 1, // Convert annual % to a weekly rate
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
          (Number(demoData[industry]) || 0) / 100.0, // convert % to decimal
        ])
      );

      const backendDemoData = {
        income: {
          mean: demoData.meanIncome,
          sd: demoData.sdIncome,
        },
        proportion: demoData.proportion / 100.0, // 33 -> 0.33
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
