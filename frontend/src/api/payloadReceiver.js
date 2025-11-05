import { IndustryType } from "../types/IndustryType.js";
import { Demographic } from "../types/Demographic.js";

/**
 * Transforms the policies received from the backend to a format used by the frontend.
 * This function reverses the logic of `buildPoliciesPayload`.
 *
 * @param {object} backendPolicies - The policies object received from the backend.
 * @returns {object} The policies object formatted for the frontend's policyParams state.
 */
export function receivePoliciesPayload(backendPolicies) {
  const frontendPolicies = {};

  // Helper to safely get the first value from an industry-specific policy dictionary.
  // This assumes that for policies like corporate tax, sales tax, etc., the frontend
  // currently uses a single input that is applied uniformly across all industries.
  // TODO: make this just give every value. Currently, the frontend is not setup to
  // get the taxes on a industry-specific basis.
  const getUniformIndustryPolicyValue = (policyDict) => {
    if (typeof policyDict === "object" && policyDict !== null) {
      const industryKeys = Object.values(IndustryType);
      if (
        industryKeys.length > 0 &&
        policyDict[industryKeys[0]] !== undefined
      ) {
        return policyDict[industryKeys[0]];
      }
    }
    // Fallback if the structure is unexpected or empty
    return 0;
  };

  // Helper to safely get the first value from a demographic-specific policy dictionary.
  // This assumes that for policies like personal income tax, the frontend
  // currently uses a single input that is applied uniformly across all demographics.
  // TODO: make this just give every value. Currently, the frontend is not setup to
  // get the taxes on a demographic-specific basis.
  const getUniformDemographicPolicyValue = (policyDict) => {
    if (typeof policyDict === "object" && policyDict !== null) {
      const demographicKeys = Object.values(Demographic);
      if (
        demographicKeys.length > 0 &&
        policyDict[demographicKeys[0]] !== undefined
      ) {
        return policyDict[demographicKeys[0]];
      }
    }
    // Fallback if the structure is unexpected or empty
    return 0;
  };

  // Policies that are percentages and are uniform across industries in the frontend
  frontendPolicies.corporateTax =
    getUniformIndustryPolicyValue(backendPolicies.corporate_income_tax) * 100;
  frontendPolicies.salesTax =
    getUniformIndustryPolicyValue(backendPolicies.sales_tax) * 100;
  frontendPolicies.tariffs =
    getUniformIndustryPolicyValue(backendPolicies.tariffs) * 100;
  frontendPolicies.subsidies =
    getUniformIndustryPolicyValue(backendPolicies.subsidies) * 100;

  // Policies that are percentages and are single values in the frontend
  frontendPolicies.personalIncomeTax =
    getUniformDemographicPolicyValue(backendPolicies.personal_income_tax) * 100;
  frontendPolicies.propertyTax = backendPolicies.property_tax * 100;

  // Policies that are direct values (not percentages)
  frontendPolicies.rentCap = backendPolicies.rent_cap;
  frontendPolicies.minimumWage = backendPolicies.minimum_wage;

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
    inflationRate: ((1 + backendConfig.inflation_rate) ** 52 - 1) * 100, // convert to annual, then make percentage0.001 -> 0.1
    // Note: maxSimulationLength and randomEvents are not part of the template,
    // so they will retain their default values in SetupPage.
  };
}

/**
 * Transforms the demographic parameters from the backend into the format
 * expected by the frontend's demoParams state.
 *
 * @param {object} backendDemographics - The demographics object from the backend config.
 * @returns {object} The demoParams object for the frontend.
 */
export function receiveDemographicsPayload(backendDemographics) {
  return Object.fromEntries(
    Object.values(Demographic).map((demoValue) => {
      const backendDemo = backendDemographics[demoValue];
      if (!backendDemo) return [demoValue, {}]; // Should not happen with valid templates

      // TODO: don't do this once spending behavior is as of each industry
      // For spending behavior, take the first value assuming it's uniform for now.
      const spendingBehaviorValue =
        Object.values(backendDemo.spending_behavior)[0] || 0;

      const frontendDemo = {
        meanIncome: backendDemo.income.mean,
        sdIncome: backendDemo.income.sd,
        proportion: backendDemo.proportion * 100, // 0.33 -> 33
        spendingBehavior: spendingBehaviorValue * 100, // 0.7 -> 70
        meanSavings: backendDemo.balance.mean,
        sdSavings: backendDemo.balance.sd,
        unemploymentRate: backendDemo.unemployment_rate * 100, // 0.05 -> 5
      };
      return [demoValue, frontendDemo];
    })
  );
}

/**
 * Transforms the industry parameters from the backend into the format
 * expected by the frontend's industryParams state.
 *
 * @param {object} backendIndustries - The industries object from the backend config.
 * @returns {object} The industryParams object for the frontend.
 */
export function receiveIndustriesPayload(backendIndustries) {
  return Object.fromEntries(
    Object.values(IndustryType).map((industryValue) => {
      const backendIndustry = backendIndustries[industryValue];
      if (!backendIndustry) return [industryValue, {}];

      const frontendIndustry = {
        startingInventory: backendIndustry.inventory,
        startingPrice: backendIndustry.price,
        industrySavings: backendIndustry.balance,
        offeredWage: backendIndustry.offered_wage,
      };
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
    demoParams: receiveDemographicsPayload(backendConfig.demographics),
    industryParams: receiveIndustriesPayload(backendConfig.industries),
    policyParams: receivePoliciesPayload(backendConfig.policies),
  };
}
