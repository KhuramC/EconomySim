from mesa import Agent
from mesa import Model
from ..types.industry_type import IndustryType
from ..types.Pricing_Type import PricingType
from pricing import adjusted_marginal_cost_pricing, avg_cost, linear_profit_max, variable_cost_per_unit
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
        # New signature / behavior: optionally check funds and adjust production
        # Keep default behavior for backward compatibility by using sensible defaults
        employee_efficiency = 1.0  # placeholder for number of goods produced per employee
        employees = self.get_employees()
        num_employees = len(employees) if employees is not None else 0

        # production capacity based on employees (fallback to placeholder if no employees)
        employee_production_capacity = int(num_employees * employee_efficiency)
        intended_qty = employee_production_capacity if employee_production_capacity > 0 else 15

        # Compute variable cost per unit from agent state (fallbacks if unset)
        variable_per_unit = self.variable_cost if getattr(self, 'variable_cost', None) is not None else 5.0

        # Optional check: reduce production if fixed + variable costs exceed available funds
        check_funds = True
        available_funds = self.total_money if self.total_money is not None else 0.0
        fixed_due = self.fixed_cost if getattr(self, 'fixed_cost', None) is not None else 0.0
        total_variable_cost = variable_per_unit * intended_qty

        adjusted_qty = intended_qty
        if check_funds:
            # reserve funds for fixed costs first
            available_for_variable = available_funds - fixed_due
            if available_for_variable <= 0:
                # Not enough to cover fixed costs; cannot afford any variable production without going further into debt
                logging.info(f"Insufficient funds to cover fixed costs (fixed_due={fixed_due:.2f}); adjusted production to 0")
                adjusted_qty = 0
            else:
                if variable_per_unit <= 0:
                    # Can't compute affordability if per-unit cost is nonpositive; leave unchanged
                    adjusted_qty = intended_qty
                else:
                    affordable = int(available_for_variable // variable_per_unit)
                    adjusted_qty = max(0, min(intended_qty, affordable))
                    if adjusted_qty < intended_qty:
                        logging.info(f"Adjusted production from {intended_qty} to {adjusted_qty} due to insufficient funds (fixed+variable)")

        # Apply production and deduct both fixed cost and variable cost spent
        self.inventory = self.inventory + adjusted_qty
        spent_variable = variable_per_unit * adjusted_qty
        spent_fixed = fixed_due
        # Deduct fixed then variable (allowing debt if insufficient)
        prior_funds = self.total_money if self.total_money is not None else 0.0
        self.total_money = prior_funds - spent_fixed - spent_variable

        # Log warnings if we went into debt
        if self.total_money < 0:
            logging.warning(f"Industry has negative funds after production: {self.total_money:.2f}")

        logging.info(f"Produced {adjusted_qty} units; spent_variable={spent_variable:.2f}; spent_fixed={spent_fixed:.2f}; remaining funds {self.total_money:.2f}")
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
