from enum import StrEnum


class Demographic(StrEnum):
    """
    An enumeration of the different demographics supported by the simulation.
    """

    LOWER_CLASS = "lower class"
    MIDDLE_CLASS = "middle class"
    UPPER_CLASS = "upper class"

# TODO: Elaborate on CES function.
# The CES utility function that we use to model a PersonAgent's spending behavior includes a hyperparameter,
# sigma which represents the elasticty for substitution, that is set to be constant at 1 for all 
# PersonAgents. The beauty of this simplicity is that it turns the utility function into the Cobb-Douglas
# utility function, which is what is currently implemetnted in `demand_func`.
# Could there be a better way to represent demand for goods across different demographics/PersonAgents?
# Update the enum below and demand_func in person.py with your solution.
# see this for CES utility function: https://www.econgraphs.org/textbooks/intermediate_micro/scarcity_and_choice/preferences_and_utility/ces

DEMOGRAPHIC_SIGMAS: dict[Demographic, float] = {
    Demographic.LOWER_CLASS: 1,
    Demographic.MIDDLE_CLASS: 1,
    Demographic.UPPER_CLASS: 1
}