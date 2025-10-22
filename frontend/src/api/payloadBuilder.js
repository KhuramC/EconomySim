import { IndustryType } from "../types/IndustryType.js";

/**
 * Transforms the frontend 'params' state into the JSON payload
 * expected by the backend's ModelCreateRequest.
 * @param {object} params - The 'params' state from SetupPage.jsx
 * @returns {object} The backend-ready payload
 */
export function buildCreatePayload(params) {
  // Prepare Demographics
  const demographics = Object.fromEntries(
    Object.entries(params.demoParams).map(([demoValue, demoData]) => {
      // TODO: Update this to match backend once spending behavior is finalized
      // Create the spending_behavior as dictionary with keys of each industry
      const spendingRate = demoData.spendingBehavior / 100.0; // 70 -> 0.70
      const spendingBehaviorDict = Object.fromEntries(
        Object.values(IndustryType).map((value) => [value, spendingRate])
      );

      const newDemoData = {
        income: {
          mean: demoData.meanIncome,
          sd: demoData.sdIncome,
        },
        proportion: demoData.proportion / 100.0, // 33 -> 0.33
        unemployment_rate: demoData.unemploymentRate / 100.0, // 1.00 -> 0.01
        spending_behavior: spendingBehaviorDict,
        current_money: {
          mean: demoData.meanSavings,
          sd: demoData.sdSavings,
        },
      };
      return [demoValue, newDemoData];
    })
  );

  // Prepare Industries
  const industries = Object.fromEntries(
    Object.entries(params.industryParams).map(([industryKey, industryData]) => {
      const backendIndustryData = {
        price: industryData.startingPrice,
        inventory: industryData.startingInventory,
        money: industryData.industrySavings,
        offered_wage: industryData.offeredWage,
      };
      return [industryKey, backendIndustryData];
    })
  );

  // Prepare Policies
  // TODO: change this whenever policies are separated by demographics/industry type in the frontend
  const policies = {
    corporate_income_tax: Object.fromEntries(
      Object.values(IndustryType).map((value) => [
        value,
        params.policyParams.corporateTax / 100.0,
      ])
    ),
    personal_income_tax: params.policyParams.personalIncomeTax / 100.0,
    sales_tax: Object.fromEntries(
      Object.values(IndustryType).map((value) => [
        value,
        params.policyParams.salesTax / 100.0,
      ])
    ),
    property_tax: params.policyParams.propertyTax / 100.0,
    tariffs: Object.fromEntries(
      Object.values(IndustryType).map((value) => [
        value,
        params.policyParams.tariffs / 100.0,
      ])
    ),
    subsidies: Object.fromEntries(
      Object.values(IndustryType).map((value) => [
        value,
        params.policyParams.subsidies / 100.0, // Assuming %
      ])
    ),
    rent_cap: params.policyParams.rentCap,
    minimum_wage: params.policyParams.minimumWage,
  };

  // Create final payload
  const payload = {
    max_simulation_length: params.envParams.maxSimulationLength,
    num_people: params.envParams.numPeople,
    inflation_rate: params.envParams.inflationRate / 100, // e.g., 0.1% -> 0.001
    random_events: params.envParams.randomEvents,
    demographics: demographics,
    industries: industries,
    policies: policies,
  };

  return payload;
}
