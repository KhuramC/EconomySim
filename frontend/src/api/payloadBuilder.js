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
    property_tax: policyParams.propertyTax / 100.0,
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
    rent_cap: policyParams.rentCap,
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
    inflation_rate: envParams.inflationRate / 100, // e.g., 1.0% -> 0.01
    random_events: envParams.randomEvents,
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
      // TODO: Update this to match backend once spending behavior is finalized
      // Create the spending_behavior as dictionary with keys of each industry
      const spendingRate = demoData.spendingBehavior / 100.0; // 70 -> 0.70
      const spendingBehaviorDict = Object.fromEntries(
        Object.values(IndustryType).map((value) => [value, spendingRate])
      );

      const backendDemoData = {
        income: {
          mean: demoData.meanIncome,
          sd: demoData.sdIncome,
        },
        proportion: demoData.proportion / 100.0, // 33 -> 0.33
        unemployment_rate: demoData.unemploymentRate / 100.0, // 5.0 -> 0.05
        spending_behavior: spendingBehaviorDict,
        current_money: {
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
        price: industryData.startingPrice,
        inventory: industryData.startingInventory,
        money: industryData.industrySavings,
        offered_wage: industryData.offeredWage,
      };
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
