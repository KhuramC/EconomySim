from mesa import Agent
from mesa import Model
from ..types.industry_type import IndustryType, INDUSTRY_PRICING
from ..types.Pricing_Type import PricingType
from .pricing import avg_cost, linear_profit_max, variable_cost_per_unit
import logging
import math


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
    #TODO: Possible feature for employment logic: have each person agent have a custom wage, with minimum wage cap, meaning some workers are cheaper than others
    offered_wage: float
    """The weekly wage offered by this industry."""
    fixed_cost: float
    """The fixed cost incurred by this industry per time step."""
    raw_mat_cost: float
    """The cost of raw materials per unit produced."""
    num_employees: int
    """The number of employees in this industry."""
    #TODO: Possible feature for employment logic: have each person agent have a custom efficiency, meaning some workers produce more goods than others
    worker_efficiency: float
    """The efficiency of workers in this industry (units produced per worker per hour)."""
    hours_worked: float
    """Number of hours worked by each employee this tick, used for updating employee pay"""
    debt_allowed: bool
    """Whether this industry is allowed to go into debt."""
    demand_intercept: float
    """The demand intercept (A) for the industry's demand curve."""
    demand_slope: float
    """The demand slope (B) for the industry's demand curve."""
    inventory_available_this_step: int
    """The inventory available for sale this time step."""
    
    def __init__(
        self,
        model: Model,
        industry_type: IndustryType,
        starting_price: float = 0.0,    #This should only be passed in when testing.  Determine_price & determine_price_production_cap will entirely handle updates to this value
        starting_inventory: int = 200,
        starting_money: float = 5000.00,
        starting_offered_wage: float = 15.00,
        starting_fixed_cost: float = 200.0,
        starting_raw_mat_cost: float = 2.0,
        starting_number_of_employees: int = 5, #placeholder value for now that should be dependant on person agents employed at industry when employment logic has been implemented
        starting_worker_efficiency: float = 1.0,
        starting_debt_allowed: bool = True, #should be static
        #TODO: Demand logic will be pulled from another file, either demand.py or person.py.  These values are currently black box standins to enable determine_price logic
        starting_demand_intercept: float = 400.0,
        starting_demand_slope: float = 1.0,
    ):
        """
        Initialize an IndustryAgent with its starting values.
        """
        super().__init__(model)
        self.industry_type = industry_type
        self.price = starting_price
        self.inventory = starting_inventory
        self.total_money = starting_money
        self.offered_wage = starting_offered_wage
        self.fixed_cost = starting_fixed_cost
        self.raw_mat_cost = starting_raw_mat_cost
        self.num_employees = starting_number_of_employees
        self.worker_efficiency = starting_worker_efficiency
        self.debt_allowed = starting_debt_allowed
        self.demand_intercept = starting_demand_intercept
        self.demand_slope = starting_demand_slope
        self.inventory_available_this_step = 0      #calculated by determine_price
        self.hours_worked = 0                       #calculated by produce_goods
        

    def get_tariffs(self) -> float:
        """
        Get the tariff rate for this industry from the model's tax rates.

        Returns:
            float: The tariff rate for this industry.
        """
        tariffs = self.model.policies.get("tariffs", {})
        return tariffs.get(self.industry_type, 0.0)

    def get_employees(self):
        """
        Gets all employees that are employed to this industry.
        """
        return self.model.get_employees(self.industry_type)
    def determine_price(self):
        """
        Determine the price of goods/services in this industry based on market conditions.

        Uses the industry's demand parameters (self.demand_intercept, self.demand_slope),   
        variable cost from self.get_variable_cost(), and fixed cost self.fixed_cost.
        Supports AVG_COST and LINEAR_PROFIT_MAX pricing strategies.
        """

        A = float(self.demand_intercept)
        B = float(self.demand_slope)

        # variable cost and marginal cost parameters
        V = float(self.get_variable_cost())         # per-unit variable cost
        m = V                                       # MC intercept (constant MC here)
        n = 0.0                                     # MC slope (zero => constant MC)

        # feasible maximum to consider when computing suggested Q:
        # allow selling current inventory plus what production capacity will add this step
        #production capacity is capped by two variables: the number of employees and the total available funds
        Q_max = int(max(0, self.inventory + self.get_production_capacity()))

        Price = self.price
        Suggested_Quantity = float(self.inventory)
        
        strategy = INDUSTRY_PRICING[self.industry_type]
        
        if strategy == PricingType.AVG_COST:
            Price, Suggested_Quantity = avg_cost(A, B, V, float(self.fixed_cost), Q_max)
        elif strategy == PricingType.LINEAR_PROFIT_MAX:
            Price, Suggested_Quantity = linear_profit_max(A, B, m, n, Q_max)

        # ensure suggested quantity is feasible and non-negative, clamp to [0, Q_max]
        if Suggested_Quantity is None:
            Suggested_Quantity = 0.0
        Suggested_Quantity = float(max(0.0, min(Suggested_Quantity, Q_max)))
        #TODO: Implement Logic to hire more employees if the max_production_capacity is too small to accomodate suggested quantity
        #Note: don't just look at Q_max here, as this number also takes into account if there's insufficient funds to produce at the suggested quantity
        #Instead, just factor in max capacity based on a 40 hour work week with all current employees
        
        # set results on the instance
        self.price = float(Price)
        # inventory_available_this_step is how many units are expected to be available to sell this step
        self.inventory_available_this_step = Suggested_Quantity

    def produce_goods(self):
        #TODO: Implement logic to sell stored inventory first before producing more goods on top.
        #The current logic hinders this, as we don't want to immediately cut hours based on a temporary supply surplus
        #We also don't neccisarily want to change the price of the goods being sold, just because the production cost went down
        quantity_to_produce = self.inventory_available_this_step
        variable_cost_per_unit = self.get_variable_cost()
        total_variable_cost = variable_cost_per_unit * quantity_to_produce
        if not self.debt_allowed:
            total_cost = self.fixed_cost + total_variable_cost
            # If debt is not allowed, ensure we have enough funds to cover costs
            if total_cost > self.total_money:
                # Calculate max affordable quantity
                quantity_to_produce = int((self.total_money - self.fixed_cost) / variable_cost_per_unit)
                quantity_to_produce = max(0, quantity_to_produce)  # Avoid negative production
            self.determine_price_production_cap(int(quantity_to_produce))
            hours_worked = quantity_to_produce / (self.num_employees * self.worker_efficiency) if self.num_employees * self.worker_efficiency > 0 else 0
            total_hours_worked = hours_worked * self.num_employees
            total_full_hours = self.num_employees * 40
            hours_cut = total_full_hours - total_hours_worked
            
            self.hours_worked = hours_worked #update hours worked for each employee this tick.  Assume equal number of hours for each employee for now
            
            if hours_cut >= 40:
                logging.info(f"Total employee work hours reduced by {hours_cut:.1f} to stay within budget.")
                #TODO If the number of hours needed can consistently be accomplished by fewer employees, trigger firing.  (call change_employment here!)
            
        # Update inventory and deduct costs
        self.inventory += quantity_to_produce
        spent_variable = variable_cost_per_unit * quantity_to_produce
        spent_fixed = self.fixed_cost
        self.total_money = self.total_money - spent_fixed - spent_variable     
        logging.info(
            f"Produced {quantity_to_produce:.2f} units; spent_variable={spent_variable:.2f}; "
            f"spent_fixed={spent_fixed:.2f}; remaining funds {self.total_money:.2f}; "
            f"total_hours_worked={quantity_to_produce:.1f}"
        )
        
    def determine_price_production_cap(self, production_capacity: int):
        """
        Simpler determine_price helper function for handling exceptions in produce_goods
        Skips the step that determines the suggested quantity and just updates the price
        
        NOTE: shouldn't be accessible outside of internal calls from model. how to fix?
        """
        A = self.demand_intercept
        B = self.demand_slope
        self.inventory_available_this_step = production_capacity
        self.price = A - B * production_capacity
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
        Return variable cost per unit: (wage / efficiency) + raw_material_cost.

        If efficiency <= 0, return float('inf') to signal that per-unit cost is undefined
        (production is impossible / infeasible).
        """
        try:
            ow = float(self.offered_wage)
            eff = float(self.worker_efficiency)
            rm = float(self.raw_mat_cost)
        except Exception as exc:
            raise ValueError("offered_wage, worker_efficiency, raw_mat_cost must be numeric") from exc

        # detect NaN / Inf early
        if any(math.isnan(x) for x in (ow, eff, rm)):
            raise ValueError("NaN encountered in cost inputs")
        if any(math.isinf(x) for x in (ow, eff, rm)):
            raise ValueError("Infinite cost/input encountered")

        if eff <= 0.0:
            # semantics: if eff==0 we cannot produce — treat per-unit cost as infinite
            return float("inf")

        return (ow / eff) + rm
    def get_production_capacity(self):
        """
        Get production capacity based on workers and funds available.

        Returns an int (capacity in units). If production is infeasible returns 0.
        """
        # worker_limit: how many units can workers produce this period
        # (num_employees * efficiency * hours_per_worker); hours assumed 40 here
        # clamp at zero and floor to int
        worker_capacity_raw = self.num_employees * self.worker_efficiency * 40
        worker_limit = int(max(0, math.floor(worker_capacity_raw)))

        # handle no worker capacity quickly
        if worker_limit <= 0:
            return 0

        variable_cost_per_unit = self.get_variable_cost()

        # Validate variable_cost_per_unit BEFORE dividing
        # Accept only positive, finite costs
        if (
            not math.isfinite(variable_cost_per_unit)
            or variable_cost_per_unit <= 0.0
        ):
            # If cost is infinite / undefined -> no funds-based production possible
            # If cost <= 0 (shouldn't happen) treat as no funds bound (or choose worker_limit)
            # Here we'll treat as funds_limit = 0 for safety (you can change policy)
            funds_limit = 0
        else:
            # compute funds_limit safely — protect against unreasonable huge values
            funds_limit_raw = self.total_money / variable_cost_per_unit
            # if funds_limit_raw is not finite for some reason, fall back to 0
            if not math.isfinite(funds_limit_raw):
                funds_limit = 0
            else:
                # clamp to a sensible integer range before floor to avoid overflow
                # e.g., prevent converting > maxsize ints (though Python int is unbounded, math.floor can choke on inf)
                funds_limit = int(max(0, math.floor(funds_limit_raw)))

        # final capacity is the min of worker limit and funds limit
        return min(worker_limit, funds_limit)

        
    def set_demand_graph_params(self, A: float, B: float):
        """
        Set the demand graph parameters for the industry.
        
        A: demand intercept (P at Q=0)
        B: demand slope (P = A - B Q), B > 0
        """
        self.demand_A = A
        self.demand_B = B
    
    def get_weekly_pay(self):
        """
        Helper function for calculating weekly pay for each employee this tick
        """
        return self.hours_worked * self.offered_wage
    