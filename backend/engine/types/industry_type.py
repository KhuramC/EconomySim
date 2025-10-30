from enum import StrEnum
from .Pricing_Type import PricingType
class IndustryType(StrEnum):
    """
    An enumeration of different industry types supported by the simulation.
    """

    GROCERIES = "groceries"
    UTILITIES = "utilities"
    AUTOMOBILES = "automobiles"
    HOUSING = "housing"
    HOUSEHOLD_GOODS = "household goods"
    ENTERTAINMENT = "entertainment"
    LUXURY = "luxury"

INDUSTRY_PRICING: dict[IndustryType, PricingType] = {
    IndustryType.GROCERIES: PricingType.LINEAR_PROFIT_MAX,
    IndustryType.UTILITIES: PricingType.AVG_COST,
    IndustryType.AUTOMOBILES: PricingType.LINEAR_PROFIT_MAX,
    IndustryType.HOUSING: PricingType.LINEAR_PROFIT_MAX,
    IndustryType.HOUSEHOLD_GOODS: PricingType.LINEAR_PROFIT_MAX,
    IndustryType.ENTERTAINMENT: PricingType.LINEAR_PROFIT_MAX,
    IndustryType.LUXURY: PricingType.LINEAR_PROFIT_MAX
}