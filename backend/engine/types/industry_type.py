from enum import StrEnum
from .pricing_type import PricingType
class IndustryType(StrEnum):
    """
    An enumeration of different industry types supported by the simulation.
    """

    GROCERIES = "Groceries"
    UTILITIES = "Utilities"
    AUTOMOBILES = "Automobiles"
    HOUSING = "Housing"
    HOUSEHOLD_GOODS = "Household Goods"
    ENTERTAINMENT = "Entertainment"
    LUXURY = "Luxury"

INDUSTRY_PRICING: dict[IndustryType, PricingType] = {
    IndustryType.GROCERIES: PricingType.LINEAR_PROFIT_MAX,
    IndustryType.UTILITIES: PricingType.AVG_COST,
    IndustryType.AUTOMOBILES: PricingType.LINEAR_PROFIT_MAX,
    IndustryType.HOUSING: PricingType.LINEAR_PROFIT_MAX,
    IndustryType.HOUSEHOLD_GOODS: PricingType.LINEAR_PROFIT_MAX,
    IndustryType.ENTERTAINMENT: PricingType.LINEAR_PROFIT_MAX,
    IndustryType.LUXURY: PricingType.LINEAR_PROFIT_MAX
}
