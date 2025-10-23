from enum import StrEnum


class Demographic(StrEnum):
    """
    An enumeration of the different demographics supported by the simulation.
    """

    LOWER_CLASS = "lower class"
    MIDDLE_CLASS = "middle class"
    UPPER_CLASS = "upper class"

## TODO: Should sigma be a bigger model variable?
# see this for CES utility function: https://www.econgraphs.org/textbooks/intermediate_micro/scarcity_and_choice/preferences_and_utility/ces

DEMOGRAPHIC_SIGMAS: dict[Demographic, float] = {
    Demographic.LOWER_CLASS: 1,
    Demographic.MIDDLE_CLASS: 1,
    Demographic.UPPER_CLASS: 1
}