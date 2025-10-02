from enum import StrEnum


class CityTemplate(StrEnum):
    """
    An enumeration of the different city templates supported by the simulation.
    """

    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
