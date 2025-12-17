from mesa import Agent, Model
from .industry import IndustryAgent
from .demand import demand_func
from ..types.demographic import Demographic, DEMOGRAPHIC_SIGMAS
from ..types.industry_type import IndustryType
import logging


class PersonAgent(Agent):
    """
    An agent representing a person in the simulation.

    Attributes:
        demographic (Demographic): the economic class of the person.
        income (int): The weekly income of the person.
        employer (IndustryAgent | None): The industry agent that employs this person, or None if unemployed.
        balance (float): The current amount of money the person has; negative indicating debt.
        preferences (dict): Spending preferences a weight for each industry, summing to 1.
        sigma (float): The elasticity of substitution for the industries.
        savings_rate (float): The proportion of income saved on a weekly basis.
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
    """Spending preferences, mapping industry type to a weight. Must sum to 1."""
    sigma: float
    """The elasticity of substitution associated with the industries."""
    savings_rate: float
    """The proportion of income saved and not used on purchasing goods on a weekly basis."""

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
            # it is assumed that the highest threshold is first
            threshold = bracket["threshold"]
            rate = bracket["rate"]

            if self.income > threshold:
                # tax from current threshold to income or previous treshold
                taxable_income = min(previous_threshold, self.income) - threshold
                tax = taxable_income * rate
                self.balance -= tax

            previous_threshold = threshold

    def payday(self) -> None:
        """Weekly payday(after tax) for the agent based on their income."""
        self.balance += self.income
        self.deduct_income_tax()

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

        # sales tax logic; incorporate into person facing prices
        effective_prices = {
            agent.industry_type: (
                agent.price
                * (1 + self.model.policies["sales_tax"][agent.industry_type])
            )
            for agent in industry_agents
        }
        # Calculate desired purchases

        # TODO: force some minimum with certain industries, such as HOUSING and UTILITIES
        # since they are treated as regular industires, they don't have any higher priority, but they def should
        desired_quantities = demand_func(
            sigma=self.sigma,
            budget=self.determine_budget(),
            prefs=self.preferences,
            prices=effective_prices,
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

            available_quantity = industry.tick_sellable_inventory
            quantity_to_buy = min(desired_quantity, available_quantity)

            # prices already have sales tax applied
            cost = quantity_to_buy * effective_prices[industry_type]

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
