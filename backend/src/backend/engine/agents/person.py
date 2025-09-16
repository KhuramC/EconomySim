from mesa import Agent, Model
from .industry import IndustryAgent
from ..types.Demographic import Demographic
import logging


class PersonAgent(Agent):
    """
    An agent representing a person in the simulation.

    Attributes:
        demographic (Demographic): the economic class of the person.
        income (int): The weekly income of the person.
        employer (IndustryAgent | None): The industry agent that employs this person, or None if unemployed.
        current_money (int): The current amount of money the person has; negative indicating debt.
    """

    demographic:Demographic
    """Economic class of the person."""
    income: int
    """Weekly income of the person."""
    employer: IndustryAgent | None
    """The employer of this person, or None if unemployed."""
    current_money: int
    """The total money held by this person. Negative indicates debt."""
    # TODO: define preferences as dict. see lower TODO in demand_func

    def __init__(
        self,
        model: Model,
        demographic,
        income: int = 0,
        employer: IndustryAgent | None = None,
        current_money: int = 0,
    ):
        """
        Initialize a PersonAgent with its starting values.
        """
        super().__init__(model)
        self.demographic = demographic
        self.income = income
        self.employer = employer
        self.current_money = current_money

    def demand_func(self, preferences, prices, sigma, income):
        """
        Demand function for a product given:
        Args:
            preferences (_type_): A list of prefrences for each product.
            prices (_type_): A list of prices for each product.
            sigma (_type_): Elasticity of subsitution between products.
            income (_type_): The total money available to spend on the products.
        """

        ## TODO: update demand func to use preferences and prices as dictionaries with keys
        # being the industry type. Should sigma be a bigger model variable?
        # how do we determine how much money the user uses out of the potential they have now?
        # how do we determine what happens if they want more than is available to buy?
        # see this for CES utility function: https://www.econgraphs.org/textbooks/intermediate_micro/scarcity_and_choice/preferences_and_utility/ces

        numerators = [
            (a_i**sigma) * (p_i**sigma)  # top part of formula (excluding income)
            for a_i, p_i in zip(preferences, prices)
        ]

        denominator = (
            (a_j**sigma) * (p_j ** (1 - sigma))  # bottom part of formula
            for a_j, p_j in zip(preferences, prices)
        )

        demands = [(num / denominator) * income for num in numerators]
        return demands

    def purchase_goods(self):
        """
        How the person will try to purchase the goods available based on their preferences.
        """

        # TODO: implement CES utility function for spending behavior.
        # a somewhat base is given with demand_func
        # need to have solution for if they want 3 of one type of good and only 2 are available.
        pass

    def change_employment(self):
        """
        How the person will try to change their employment status and get hired. Only occurs if
        they are not employed.
        """
        self.income = self.income + 1
        if self.employer is not None:
            logging.info("Already employed, no action taken.")
            return

        # TODO: Implement person employment logic
        # deals with trying to find a new job if unemployed
        pass
