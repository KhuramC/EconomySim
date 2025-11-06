from enum import StrEnum

class PricingType(StrEnum):
    """
    An enumeration of different pricing strategies supported by the simulation.
    """
    AVG_COST = "avg_cost"
    LINEAR_PROFIT_MAX = "linear_profit_max"