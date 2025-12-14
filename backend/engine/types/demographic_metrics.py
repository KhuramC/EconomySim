from enum import StrEnum


class DemoMetrics(StrEnum):
    """
    An enumeration of different demographics metrics supported by the simulation.
    """

    PROPORTION = "Proportion"
    AVERAGE_BALANCE = "Average Balance"
    STD_BALANCE = "Balance Std"
    AVERAGE_WAGE = "Average Wage"
    STD_WAGE = "Wage Std"

    @classmethod
    def values(cls) -> list[str]:
        return [metric.value for metric in cls]
