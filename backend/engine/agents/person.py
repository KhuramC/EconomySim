from mesa import Agent, Model
from .industry import IndustryAgent
from ..types.demographic import Demographic
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

    demographic: Demographic
    """Economic class of the person."""
    income: int
    """Weekly income of the person."""
    employer: IndustryAgent | None
    """The employer of this person, or None if unemployed."""
    current_money: int
    """The total money held by this person. Negative indicates debt."""
    preferences: dict[str, float]
    """Spending preferences, mapping industry name to a weight. Must sum to 1."""
    sigma: float
    """The elasticity of substitution for the agent's CES utility function."""

    def __init__(
        self,
        model: Model,
        demographic: Demographic,
        preferences: dict[str, float],
        sigma: float = 1,
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
        self.preferences = preferences
        self.sigma = sigma

    def payday(self):
        """Weekly payday for the agent based on their income."""
        self.current_money = self.current_money + self.income

    def demand_func(
        self, budget: float, prefs: dict[str, float], prices: dict[str, float]
    ) -> dict[str, float]:
        """
        Calculates the quantity of each good to purchase based on the CES demand function.

        Args:
            budget: The total money available to spend.
            prefs: The preference werights for the available goods.
            prices: The prices of the available goods.
        Returns:
            A dictionary mapping each good's name to the desired quantity.
        """

        ## TODO: Should sigma be a bigger model variable?
        # see this for CES utility function: https://www.econgraphs.org/textbooks/intermediate_micro/scarcity_and_choice/preferences_and_utility/ces

        valid_goods = [name for name in prefs if name in prices]
        
        denominator = sum(
            (prefs[name] ** self.sigma) * (prices[name] ** (1 - self.sigma))
            for name in valid_goods
        )
        
        if denominator == 0:
            return {name: 0 for name in valid_goods}
        
        demands = {}
        for name in valid_goods:
            numerator = (prefs[name] ** self.sigma) * (prices[name] ** -self.sigma)
            quantity = (numerator / denominator) * budget / prices[name] # The good's share of the budget, divided by its price
            demands[name] = quantity
        
        return demands

    def purchase_goods(self):
        """
        The person receives their weekly income and then attempts to purchase goods
        from various industries based on their CES utility function.
        """
        self.payday()

        # TODO: implement CES utility function for spending behavior.
        # how do we determine how much money the user uses out of the potential they have now?
        # how do we determine what happens if they want more than is available to buy?
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
