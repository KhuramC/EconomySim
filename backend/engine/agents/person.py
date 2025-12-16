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
        
        self.industry_savings: dict[IndustryType, float] = {
            itype: 0.0 for itype in preferences
        }

    def deduct_income_tax(self) -> None:
        """Deducts personal income tax from the agent's balance based on their income."""
        personal_income_tax: list = self.model.policies["personal_income_tax"]
        if not personal_income_tax:
            return
        
        previous_threshold = float('inf')
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
    ) -> dict[str, float]:
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
            quantity_unrounded = (numerator / denominator) * budget #value is not rounded until purchase step.  This allows for savings accumulation.
            demands[name] = quantity_unrounded  

        return demands

    def custom_round(self, x: float) -> int:
        """
        Round up if x is within 0.05 of the next whole number,
        otherwise round down.
        
        Note: This is mainly used to avoid floating point precision issues
        when determining affordable quantities.
        
        Args:
            x: The float number to round.
        Returns:
            The rounded integer.
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
        Person receives income, then allocates budget by CES.
        Instead of requiring affordability this week, agents save
        per-industry until they can afford a unit.
        """

        # Receive weekly income
        self.payday()

        industry_agents = list(self.model.agents_by_type[IndustryAgent])

        # tax-adjusted prices
        prices = {
            agent.industry_type: (
                agent.price * (1 + self.model.policies["sales_tax"][agent.industry_type])
            )
            for agent in industry_agents
        }

        # CES demand → produces quantity demand per good
        desired_quantities = self.demand_func(
            budget=self.determine_budget(),
            prefs=self.preferences,
            prices=prices,
        )
        #returns an unrounded quantity demand per good

        # For each industry, we add the weekly allocated money into the savings bucket.
        for industry in industry_agents:
            itype = industry.industry_type
            if itype not in desired_quantities:
                continue

            q_desired = desired_quantities[itype]
            if q_desired <= 0:
                continue

            # allocate money = quantity * price_with_tax
            price_with_tax = prices[itype]
            allocated_dollars = q_desired * price_with_tax

            # add this to the industry-specific savings pool
            self.industry_savings[itype] += allocated_dollars

            # >>> Now attempt purchases using savings pool — not weekly budget
            savings_bucket = self.industry_savings[itype]
            if savings_bucket <= 0:
                continue
            price_with_tax = prices[itype]  # price including sales tax

            # Check if agent saved enough to buy at least 1 unit
            if savings_bucket < price_with_tax:
                continue

            # Determine how many units savings allow
            max_affordable_from_savings = self.custom_round(savings_bucket / price_with_tax)
            # Limit by inventory
            purchasable_units = min(
                max_affordable_from_savings,
                industry.inventory_available_this_step
            )

            if purchasable_units <= 0:
                continue

            # Total cost
            total_cost = purchasable_units * price_with_tax

            # Execute purchase using SAVINGS
            self.industry_savings[itype] -= total_cost
            self.balance -= total_cost
            industry.sell_goods(purchasable_units)

            logging.info(
                f"Agent {self.unique_id} purchased {purchasable_units} units of "
                f"{industry.industry_type} using saved funds."
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
