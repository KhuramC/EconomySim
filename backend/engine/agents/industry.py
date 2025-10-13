from mesa import Agent
from mesa import Model
from ..types.industry_type import IndustryType
from ..types.Pricing_Type import PricingType
from .pricing import adjusted_marginal_cost_pricing, avg_cost, linear_profit_max, variable_cost_per_unit
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
    raw_mat_cost: float
    """The cost of raw materials per unit produced."""
    worker_efficiency: float
    """The efficiency of workers in this industry (units produced per worker per hour)."""
    pricing_strategy: PricingType
    """The pricing strategy used by this industry."""
    debt_allowed: bool
    """Whether this industry is allowed to go into debt."""

    def __init__(
        self,
        model: Model,
        industry_type: IndustryType,
        starting_price: float = 0.0,
        starting_inventory: int = 0,
        starting_money: float = 0.0,
        starting_offered_wage: float = 0.0,
        starting_fixed_cost: float = 0.0,
        starting_raw_mat_cost: float = 1.0,
        starting_worker_efficiency: float = 1.0,
        pricing_strategy: PricingType = PricingType.LINEAR_PROFIT_MAX,
        debt_allowed: bool = True,
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
        self.raw_mat_cost = starting_raw_mat_cost
        self.worker_efficiency = starting_worker_efficiency
        self.fixed_cost = starting_fixed_cost
        self.pricing_strategy = pricing_strategy
        self.debt_allowed = debt_allowed
        

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
        employees = 5
        return employees #placeholder for number of employees
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
        V = self.get_variable_cost()
        Price = self.price
        Suggested_Quantity = self.inventory
        if(self.pricing_strategy == PricingType.ADJUSTED_MARGINAL_COST):
            Price, Suggested_Quantity = adjusted_marginal_cost_pricing(A, B, V, self.fixed_cost)
        elif(self.pricing_strategy == PricingType.AVG_COST):
            Price, Suggested_Quantity = avg_cost(A, B, V, self.fixed_cost)
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
        variable_cost_per_unit = self.get_variable_cost()
        
        # production capacity based on employees
        num_employees = self.get_employees()
        employee_production_capacity =  self.get_production_capacity()
        total_full_hours = num_employees * 40
        
        
        adjusted_qty = employee_production_capacity
        adjusted_hours = total_full_hours
        
        #lower worker hours until a production level is found that can be afforded
        if not self.debt_allowed:
            total_cost = self.fixed_cost + variable_cost_per_unit * employee_production_capacity
            # If debt is not allowed, ensure we have enough funds to cover costs
            if total_cost > self.total_money:
                # Calculate max affordable quantity
                max_affordable_qty = (self.total_money - self.fixed_cost) / variable_cost_per_unit
                max_affordable_qty = max(0, max_affordable_qty)  # Avoid negative production

            
            # Adjust quantity and hours proportionally
            production_ratio = max_affordable_qty / employee_production_capacity if employee_production_capacity > 0 else 0
            adjusted_qty = max_affordable_qty
            adjusted_hours = total_full_hours * production_ratio

            # Assume linear relationship: full production = 40 hours
            hours_per_employee = 40 * (adjusted_qty / employee_production_capacity if employee_production_capacity > 0 else 0)

            hours_cut = total_full_hours - adjusted_hours
            if hours_cut >= 40:
                logging.info(f"Total employee work hours reduced by {hours_cut:.1f} to stay within budget.")
            
        # Update inventory and deduct costs
        self.inventory += adjusted_qty
        spent_variable = variable_cost_per_unit * adjusted_qty
        spent_fixed = self.fixed_cost
        self.total_money = self.total_money - spent_fixed - spent_variable

        # Log warnings if we went into debt
        if self.total_money < 0:
            logging.warning(f"Industry has negative funds after production: {self.total_money:.2f}")

        logging.info(
            f"Produced {adjusted_qty:.2f} units; spent_variable={spent_variable:.2f}; "
            f"spent_fixed={spent_fixed:.2f}; remaining funds {self.total_money:.2f}; "
            f"total_hours_worked={adjusted_hours:.1f}"
        )
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
        return self.offered_wage
        # TODO: Implement industry wage logic
    def get_variable_cost(self):
        """
        Calculate the variable cost per unit based on raw material costs and labor costs.
        This should be called after any changes to raw material costs, offered wages, or employment levels
        """
        return (self.worker_efficiency / self.offered_wage) + self.raw_mat_cost
    def get_labor_costs(self):
        """
        Get the total labor costs for the industry based on current employment and wages.
        """
        employees = self.get_employees()
        num_employees = employees if employees is not None else 0
        total_labor_cost = num_employees * self.offered_wage * 40  # assuming 40 hours/week
        return total_labor_cost
    def get_production_capacity(self):
        """
        Get the production capacity based on current employment and worker efficiency.
        """
        employees = self.get_employees()
        num_employees = employees if employees is not None else 0
        production_capacity = int(num_employees * self.worker_efficiency * 40)