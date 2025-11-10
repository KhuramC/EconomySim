from enum import StrEnum


class Indicators(StrEnum):
    """
    An enumeration of the different economic indicators supported by the simulation.
    """

    UNEMPLOYMENT = "Unemployment"
    GDP = "GDP"
    INCOME_PER_CAPITA = "Income Per Capita"
    MEDIAN_INCOME = "Median Income"
    HOOVER_INDEX = "Hoover Index"
    LORENZ_CURVE = "Lorenz Curve"
    GINI_COEFFICIENT = "Gini Coefficient"

    @classmethod
    def values(cls) -> list[str]:
        return [indicator.value for indicator in cls]
