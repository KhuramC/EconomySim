from enum import StrEnum


class Indicators(StrEnum):
    """
    An enumeration of the different economic indicators supported by the simulation.
    """

    UNEMPLOYMENT = "unemployment"
    GDP = "gdp"
    INCOME_PER_CAPITA = "income per capita"
    MEDIAN_INCOME = "median income"
    HOOVER_INDEX = "hoover index"
    LORENZ_CURVE = "lorenz curve"

    @classmethod
    def values(cls) -> list[str]:
        return [indicator.value for indicator in cls]