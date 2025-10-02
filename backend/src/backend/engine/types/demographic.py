from enum import StrEnum


class Demographic(StrEnum):
    """
    An enumeration of the different demographics supported by the simulation.
    """

    LOWER_CLASS = "lowerclass"
    MIDDLE_CLASS = "middleclass"
    UPPER_CLASS = "upperclass"
