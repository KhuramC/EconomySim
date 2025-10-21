from enum import StrEnum


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
