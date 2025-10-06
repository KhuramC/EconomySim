from mesa import Agent
from mesa import Model
from ..types.IndustryType import IndustryType
from ..types.Pricing_Type import PricingType
from ..logic.pricing import adjusted_marginal_cost_pricing, avg_cost, linear_profit_max, variable_cost_per_unit
import logging


class IndustryAgent(Agent):
    """
    An agent representing an industry in the simulation.

    Attributes:
        industry_type (IndustryType): The type of industry this agent represents.
        price (float): The price of goods/services in this industry.
        inventory (int): The inventory level of goods/services in this industry.
        total_money (float): The total money held by this industry. Negative indicates debt.
        offered_wage (float): The per time step(weekly) wage offered by this industry.
    """

    industry_type: IndustryType
    """The type of industry this agent represents."""
    price: float
    """The price of goods/services in this industry."""
    inventory: int
    """The inventory level of goods/services in this industry."""
    total_money: float
    """The total money held by this industry. Negative indicates debt."""
    offered_wage: float
    """The weekly wage offered by this industry."""
    fixed_cost: float
    """The fixed cost incurred by this industry per time step."""
    variable_cost: float
    """The variable cost incurred by this industry per unit produced."""
    pricing_strategy: PricingType
    """The pricing strategy used by this industry."""

    def __init__(
        self,
        model: Model,
        industry_type: IndustryType,
        starting_price: float = 0.0,
        starting_inventory: int = 0,
        starting_money: float = 0.0,
        starting_offered_wage: float = 0.0,
        starting_fixed_cost: float = 0.0,
        starting_variable_cost: float = 0.0,
        pricing_strategy: PricingType = PricingType,
    ):
        """
        Initialize an IndustryAgent with its starting values.
        """
        super().__init__(model)
        self.price = starting_price
        self.industry_type = industry_type
        self.inventory = starting_inventory
        self.total_money = starting_money
        self.offered_wage = starting_offered_wage
        self.fixed_cost = starting_fixed_cost
        self.variable_cost = starting_variable_cost
        self.pricing_strategy = pricing_strategy

    def get_tariffs(self) -> float:
        """
        Get the tariff rate for this industry from the model's tax rates.

        Returns:
            float: The tariff rate for this industry.
        """
        tariffs = self.model.tax_rates.get("tariffs", {})
        return tariffs.get(self.industry_type, 0.0)

    def get_employees(self):
        """
        Gets all employees that are employed to this industry.
        """
        return self.model.get_employees(self.industry_type)

    def determine_price(self):
        """
        Determine the price of goods/services in this industry based on market conditions.
        
        TARRIFF COST NOT IMPLEMENTED YET
        """
        """
        A: demand intercept (P at Q=0)
        B: demand slope (P = A - B Q), B > 0
        m: MC intercept (MC = m + n Q)
        n: MC slope
        Q_max: optional upper bound on feasible Q (e.g., inventory). None => no upper bound.
        """
        A = 100  # placeholder value for demand intercept
        B = 2    # placeholder value for demand slope
        m = 0    # placeholder value for MC intercept
        n = 0    # placeholder value for MC slope
        Price = self.price
        Suggested_Quantity = self.inventory
        if(self.pricing_strategy == PricingType.ADJUSTED_MARGINAL_COST):
            Price, Suggested_Quantity = adjusted_marginal_cost_pricing(A, B, self.variable_cost, self.fixed_cost)
        elif(self.pricing_strategy == PricingType.AVG_COST):
            Price, Suggested_Quantity = avg_cost(A, B, self.variable_cost, self.fixed_cost)
        elif(self.pricing_strategy == PricingType.LINEAR_PROFIT_MAX):
            Price, Suggested_Quantity = linear_profit_max(A, B, m, n, self.inventory)
        
        if(Suggested_Quantity > self.inventory):
            #flag to produce more goods/hire more employees
            Suggested_Quantity = self.inventory  # cap to current inventory for now

        self.price = Price
        pass

    def produce_goods(self):
        """
        How the industry will determine how many goods to produce.
        
        Allow industries to go into debt to pay for fixed and variable costs if needed?
        """
        logging.info("Producing goods...NOT IMPLEMENTED")
        # TODO: Implement industry goods production
        self.inventory = self.inventory + 15  # placeholder logic
        pass

    def change_employment(self):
        """
        How the industry will change their employees, whether it be by hiring more, firing more,
        or changing the wages.
        """
        logging.info("Changing employment...NOT IMPLEMENTED")
        # TODO: Implement industry employment logic
        # deals with potentially firing or hiring employees, and wage changes
        # should call determine_wages at some point
        pass

    def determine_wages(self):
        """
        How the industry will determine what to set their hiring wages at.
        """
        logging.info("Changing wages...NOT IMPLEMENTED")
        wages = 5
        return wages
        # TODO: Implement industry wage logic
