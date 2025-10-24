from enum import StrEnum


class Demographic(StrEnum):
    """
    An enumeration of the different demographics supported by the simulation.
    """

    LOWER_CLASS = "lower class"
    MIDDLE_CLASS = "middle class"
    UPPER_CLASS = "upper class"
