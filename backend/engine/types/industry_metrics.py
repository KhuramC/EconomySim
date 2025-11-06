from enum import StrEnum


class IndustryMetrics(StrEnum):
    """
    An enumeration of different industry metrics supported by the simulation.
    """

    PRICE = "Price"
    INVENTORY = "Inventory"
    BALANCE = "Balance"
    WAGE = "Wage"
