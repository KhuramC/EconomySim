from mesa import Agent, Model
from .industry import IndustryAgent
from ..types.demographic import Demographic, DEMOGRAPHIC_SIGMAS
from ..types.industry_type import IndustryType
import logging
import math


class PersonAgent(Agent):
    """
    An agent representing a person in the simulation.

    Attributes:
        demographic (Demographic): the economic class of the person.
        income (int): The weekly income of the person.
        employer (IndustryAgent | None): The industry agent that employs this person, or None if unemployed.
        balance (float): The current amount of money the person has; negative indicating debt.
        preferences (dict): Spending preferences a weight for each industry, summing to 1.
    """

    demographic: Demographic
    """Economic class of the person."""
    income: float
    """Weekly income of the person."""
    employer: IndustryAgent | None
    """The employer of this person, or None if unemployed."""
    balance: float
    """The total dollars held by this person. Negative indicates debt."""
    preferences: dict[IndustryType, float]
    """Spending preferences, mapping industry name to a weight. Must sum to 1."""

    def __init__(
        self,
        model: Model,
        demographic: Demographic,
        preferences: dict[IndustryType, float],
        savings_rate: float = 0.10,
        income: float = 0,
        employer: IndustryAgent | None = None,
        starting_balance: float = 0.0,
    ):
        """
        Initialize a PersonAgent with its starting values.
        """
        super().__init__(model)
        self.demographic = demographic
        self.income = income
        self.employer = employer
        self.balance = starting_balance
        self.preferences = preferences
        self.savings_rate = savings_rate
        self.sigma = DEMOGRAPHIC_SIGMAS[self.demographic]

    def deduct_income_tax(self) -> None:
        """Deducts personal income tax from the agent's balance based on their income."""
        personal_income_tax: list = self.model.policies["personal_income_tax"]
        if not personal_income_tax:
            return

        previous_threshold = float("inf")
        for bracket in personal_income_tax:
            threshold = bracket["threshold"]
            rate = bracket["rate"]

            if self.income > threshold:
                taxable_income = min(previous_threshold, self.income) - threshold
                tax = taxable_income * rate
                self.balance -= tax
            else:
                continue

            previous_threshold = threshold

    def payday(self) -> None:
        """Weekly payday(after tax) for the agent based on their income."""
        self.balance += self.income
        self.deduct_income_tax()

    def demand_func(
        self,
        budget: float,
        prefs: dict[IndustryType, float],
        prices: dict[IndustryType, float],
    ) -> dict[str, int]:
        """
        Calculates the quantity of each good to purchase based on the CES demand function.

        Args:
            budget: The total money available to spend.
            prefs: The preference weights for the available goods.
            prices: The prices of the available goods.
        Returns:
            A dictionary mapping each good's name to the desired quantity.
        """

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
            # NOTE Should this be math.round instead?  this would return a value closer to the desired savings rate

            quantity_unrounded = (numerator / denominator) * budget
            quantity = self.custom_round(quantity_unrounded)
            demands[name] = quantity

        return demands

    def custom_round(self, x: float) -> int:
        """
        Round up if x is within 0.05 of the next whole number,
        otherwise round down.
        """
        lower = math.floor(x)
        upper = lower + 1

        # If x is within 0.05 of the upper integer, round up
        if upper - x <= 0.05:
            return upper
        else:
            return lower

    def determine_budget(self) -> float:
        """
        Determines the agent's spending budget for the week based on their
        income and savings rate.
        """

        # TODO: How does this savings_rate get updated?
        # Is it based off of demographic?

        budget = self.income * (1 - self.savings_rate)
        return max(0.0, budget)  # Must be non-negative

    def purchase_goods(self):
        """
        The person receives their weekly income and then attempts to purchase goods
        from various industries based on their CES utility function.
        """

        # Receive periodic income
        self.payday()

        # Get industry and pricing info
        industry_agents = list(self.model.agents_by_type[IndustryAgent])

        # sales tax will now be incorporated into price calculation
        prices = {
            agent.industry_type: (
                agent.price
                * (1 + self.model.policies["sales_tax"][agent.industry_type])
            )
            for agent in industry_agents
        }

        # Calculate desired purchases
        desired_quantities = self.demand_func(
            budget=self.determine_budget(), prefs=self.preferences, prices=prices
        )

        # Attempt to purchase goods
        for industry in industry_agents:
            industry_type = industry.industry_type
            if industry_type not in desired_quantities:
                continue

            desired_quantity = desired_quantities[industry_type]
            if desired_quantity <= 0:
                continue

            # TODO: Shortage Handling
            # how do we determine what happens if they want more than is available to buy?
            # Currently, if a good is unavailable, the agent simply doesn't spend that portion of their budget.
            # This unspent money is effectively saved for the next cycle.

            available_quantity = industry.inventory_available_this_step
            quantity_to_buy = min(desired_quantity, available_quantity)

            # sales tax logic
            cost = quantity_to_buy * industry.price
            sales_tax = self.model.policies["sales_tax"][industry.industry_type]
            if sales_tax is not None:
                cost += cost * sales_tax

            if self.balance >= cost:
                # Execute transaction
                self.balance -= cost
                industry.sell_goods(quantity_to_buy)
                logging.info(
                    f"Agent {self.unique_id} purchased {quantity_to_buy:.2f} of {industry.industry_type}"
                )
            else:
                logging.warning(
                    f"Agent {self.unique_id} has insufficient funds for {industry.industry_type}"
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

    def update_class(self, median_income: float) -> None:
        """
        Updates the agent's demographic class based on their current income
        relative to the population media.

        Thresholds (Pew Research Center Definition):
        - Lower Class: < 67% of Median
        - Middle Class: 67% to 200% of Median
        - Upper Class: > 200% of Median

        Args:
            median_income (float)
        """

        low_threshold = 0.67 * median_income
        high_threshold = 2.00 * median_income

        if self.income < low_threshold:
            self.demographic = Demographic.LOWER_CLASS
        elif self.income > high_threshold:
            self.demographic = Demographic.UPPER_CLASS
        else:
            self.demographic = Demographic.MIDDLE_CLASS
