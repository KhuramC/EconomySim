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
    income: int
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
        income: int = 0,
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

    def payday(self):
        """Weekly payday for the agent based on their income."""
        self.balance = self.balance + self.income

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
            quantity: int = math.floor(
                (numerator / denominator) * budget
            )  # The good's share of the budget, rounded down
            demands[name] = quantity

        return demands
    def demand_tangent_tuple(
        self,
        budget: float,
        prefs: dict[IndustryType, float],
        prices: dict[IndustryType, float],
        epsilon: float = 1e-12,
    ) -> dict[str, tuple[float, float | None]]:
        """
        For each industry, return ONLY:
            ( slope_of_tangent, price_at_zero_quantity )
    
        - slope = dq/dp at the current price
        - price_at_zero = price where tangent line hits quantity = 0
            p_zero = p0 - q0 / slope
        Returns None if slope = 0 or result is not positive/finite.
        """

        valid_goods = [g for g in prefs if g in prices]

        sigma = self.sigma
        A = {g: prefs[g] ** sigma for g in valid_goods}         #get spending preferences for each industry
        p = {g: max(prices[g], epsilon) for g in valid_goods}   #clamp to zero

        # denominator of CES demand
        D = sum(A[g] * (p[g] ** (1 - sigma)) for g in valid_goods) 

        # If denominator is zero, return zero slope & None zero-price
        if D <= 0:
            return {
                g.name if hasattr(g, "name") else str(g): (0.0, None)
                for g in valid_goods
            }

        results = {}

        for g in valid_goods:
            Ai = A[g]
            pi = p[g]

            # quantity at current price (continuous)
            q0 = budget * (Ai * (pi ** (-sigma)) / D)
            #if sigma = 1, this is budget * (pref/price)
            
            # derivative dq/dp (own-price partial)
            B = budget
            dD_dpi = Ai * (1 - sigma) * (pi ** (-sigma))
            # if sigma = 1, dD_dpi = 0
            term1 = Ai * (-sigma) * (pi ** (-sigma - 1)) / D    #pref * -1 * (price ^ -2) = -pref/price^2
            term2 = Ai * (pi ** (-sigma)) * (-1) * dD_dpi / (D * D) #(pref * (price ^ -1) * -1 * 0) 
            slope = B * (term1 + term2)

            # compute tangent-line zero point
            if slope == 0 or not math.isfinite(slope):
                p_zero = None
            else:
                p_zero_candidate = pi - (q0 / slope)
                # only return positive finite price
                if math.isfinite(p_zero_candidate) and p_zero_candidate > 0:
                    p_zero = p_zero_candidate
                else:
                    p_zero = None

            key = g.name if hasattr(g, "name") else str(g)
            results[key] = (slope, p_zero)

        return results

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
        prices = {agent.industry_type: agent.price for agent in industry_agents}

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

            available_quantity = industry.inventory
            quantity_to_buy = min(desired_quantity, available_quantity)

            cost = quantity_to_buy * industry.price

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
