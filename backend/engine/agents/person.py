from mesa import Agent, Model
from .industry import IndustryAgent
from ..types.demographic import Demographic
from ..types.industry_type import IndustryType
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
        savings_rate: float = 0.10,
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
        self.savings_rate = savings_rate

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
            quantity = (
                (numerator / denominator) * budget / prices[name]
            )  # The good's share of the budget, divided by its price
            demands[name] = quantity

        return demands

    def determine_budget(self):
        """
        Determines the agent's spending budget for the week based on their
        income and savings rate.
        """
        budget = self.income * (1 - self.savings_rate)
        return max(0, budget)  # Must be non-negative

    def purchase_goods(self):
        """
        The person receives their weekly income and then attempts to purchase goods
        from various industries based on their CES utility function.
        """

        # Receive periodic income
        self.payday()

        # Get industry and pricing info
        all_industries = [
            industryAgent.industry_type
            for industryAgent in self.model.agents_by_type[IndustryAgent]
        ]  # API call to get available industries.
        prices = {
            industryAgent.industry_type: industryAgent.price
            for industryAgent in self.model.agents_by_type[IndustryAgent]
        }  # Retrieve price data for each industry

        # Calculate desired purchases
        desired_quantities = self.demand_func(
            budget=self.determine_budget(), prefs=self.preferences, prices=prices
        )

        # Attempt to purchase goods
        for industry in all_industries:
            if industry not in desired_quantities:
                continue

            desired_quantity = desired_quantities[industry]
            if desired_quantity <= 0:
                continue

            # TODO: Shortage Handling
            # how do we determine what happens if they want more than is available to buy?
            # Currently, if a good is unavailable, the agent simply doesn't spend that portion of their budget.
            # This unspent money is effectively saved for the next cycle.

            available_quantity = industry.inventory
            quantity_to_buy = min(desired_quantity, available_quantity)

            cost = quantity_to_buy * industry.price

            if self.current_money >= cost:
                # Execute transaction
                self.current_money -= cost
                industry.sell_goods(quantity_to_buy)
                logging.info(
                    f"Agent {self.unique_id} purchased {quantity_to_buy:.2f} of {industry}"
                )
            else:
                logging.warning(
                    f"Agent {self.unique_id} has insufficient funds for {industry}"
                )

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
