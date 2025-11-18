import { IndustryType } from "../types/IndustryType.js";
import { Demographic } from "../types/Demographic.js";
import { IndustryMetrics } from "../types/IndustryMetrics.js";

function decimalToPercent(decimal) {
  return decimal * 100;
}

/**
 * Transforms a weekly compounding decimal rate to an annual percentage.
 * @param {object} weeklyDecimal
 * @returns {object}
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

  // Policies that are percentages and are uniform across industries in the frontend
  frontendPolicies.corporateTax = decimalToPercent(
    getUniformIndustryPolicyValue(backendPolicies.corporate_income_tax)
  ).toFixed(2);

  frontendPolicies.personalIncomeTax = backendPolicies.personal_income_tax.map(
    (bracket) => ({
      threshold: weeklyWagetoAnnual(bracket.threshold).toFixed(2),
      rate: weeklyDecimaltoAnnualPercent(bracket.rate).toFixed(2),
    })
  );
  frontendPolicies.salesTax = decimalToPercent(
    getUniformIndustryPolicyValue(backendPolicies.sales_tax)
  ).toFixed(2);
  // TODO: make property tax actually support both rates in the frontend
  frontendPolicies.propertyTax = decimalToPercent(
    backendPolicies.property_tax.residential
  ).toFixed(2);
  frontendPolicies.tariffs = decimalToPercent(
    getUniformIndustryPolicyValue(backendPolicies.tariffs)
  ).toFixed(2);
  frontendPolicies.subsidies = decimalToPercent(
    getUniformIndustryPolicyValue(backendPolicies.subsidies)
  ).toFixed(2);

  frontendPolicies.priceCap = weeklyDecimaltoAnnualPercent(
    getUniformIndustryPolicyValue(backendPolicies.price_cap)
  ).toFixed(2);
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

      const frontendDemo = {
        meanIncome: backendDemo.income.mean,
        sdIncome: backendDemo.income.sd,
        proportion: decimalToPercent(backendDemo.proportion).toFixed(2),
        meanSavings: backendDemo.balance.mean,
        sdSavings: backendDemo.balance.sd,

        ...Object.fromEntries(
          //spread spending as individual properties (e.g., GROCERIES: 25)
          Object.entries(backendDemo.spending_behavior).map(
            ([industryKey, value]) => [
              industryKey,
              decimalToPercent(value).toFixed(2),
            ]
          )
        ),
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
 * @param {boolean} isSetup - whether this is for setting up, or for something else.
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
    demoParams: receiveDemographicsPayload(backendConfig.demographics),
    industryParams: receiveIndustriesPayload(backendConfig.industries),
    policyParams: receivePoliciesPayload(backendConfig.policies),
  };
}
