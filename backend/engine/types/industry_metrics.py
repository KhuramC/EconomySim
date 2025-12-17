from enum import StrEnum


class IndustryMetrics(StrEnum):
    """
    An enumeration of different industry metrics supported by the simulation.
    """

    PRICE = "Price"
    INVENTORY = "Inventory"
    BALANCE = "Balance"
    WAGE = "Wage"
    NUM_EMPLOYEES = "Number of Employees"

    @classmethod
    def values(cls) -> list[str]:
        return [metric.value for metric in cls]
