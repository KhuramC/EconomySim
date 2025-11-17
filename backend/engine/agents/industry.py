from mesa import Agent, Model
from mesa.agent import AgentSet
from ..types.industry_type import IndustryType, INDUSTRY_PRICING
from ..types.pricing_type import PricingType
from .pricing import avg_cost, linear_profit_max, linear_price, quantity_from_price
import logging
import math


class IndustryAgent(Agent):
    """
    An agent representing an industry in the simulation.

    Attributes:
        industry_type (IndustryType): The type of industry this agent represents.
        price (float): The price of goods/services in this industry.
        inventory (int): The inventory level of goods/services in this industry.
        balance (float): The total money held by this industry. Negative indicates debt.
        offered_wage (float): The per time step(weekly) wage offered by this industry.
    """
    #Static Values
    industry_type: IndustryType
    """The type of industry this agent represents."""
    debt_allowed: bool
    """Whether this industry is allowed to go into debt."""

    price: float
    """The price of goods/services in this industry."""
    inventory: int
    """The total inventory level of goods/services in this industry."""
    inventory_available_this_step: int
    """The inventory available for sale this time step."""
    balance: float
    """The total money held by this industry. Negative indicates debt."""
    raw_mat_cost: float
    """The cost of raw materials per unit produced."""

    #Employment Variables
    #TODO: Possible feature for employment logic: have each person agent have a custom wage, with minimum wage floor, meaning some workers are cheaper than others
    offered_wage: float
    """The weekly wage offered by this industry."""
    num_employees: int
    """The number of employees in this industry."""
    # TODO: Possible feature for employment logic: have each person agent have a custom efficiency, meaning some workers produce more goods than others
    worker_efficiency: float
    """The efficiency of workers in this industry (units produced per worker per hour)."""
    hours_worked: float
    """Number of hours worked by each employee this tick, used for updating employee pay"""
    
    #Values that define the demand graph for a good
    demand_intercept: float
    """The demand intercept (A) for the industry's demand curve."""
    demand_slope: float
    """The demand slope (B) for the industry's demand curve."""
    
    
    #fixed costs
    salary_cost: float      #aggregate cost of all salaried employees per tick
    property_value: float   #value of all property owned by industryAgent.  used with property tax to calculate cost per tick
    insurance : float       #insurance payments per tick
    equipment_cost: float   #cost of equipment/machines per tick
    fixed_cost : float      #shorthand value used for testing. Will eventually be phased out in favor of calls to get_fixed_cost, which will work similarly to get_variable_cost
    """The fixed cost incurred by this industry per time step."""
    
    
    
    #Used in profit calculation
    total_cost: float
    """total cost of goods this tick"""
    total_revenue: float
    """total revenue from sold goods this tick"""

    def __init__(
        # TODO: associate most or all starting variables with industry_type so they don't need to be passed in via the constructor
        self,
        model: Model,
        industry_type: IndustryType,
        starting_price: float = 0.0,  # This should only be passed in when testing.  Determine_price & determine_price_production_cap will entirely handle updates to this value
        starting_inventory: int = 200,
        starting_balance: float = 5000.00,
        starting_offered_wage: float = 15.00,
        starting_fixed_cost: float = 200.0,
        starting_raw_mat_cost: float = 2.0,
        starting_number_of_employees: int = 5,  # placeholder value for now that should be dependant on person agents employed at industry when employment logic has been implemented
        starting_worker_efficiency: float = 1.0,
        starting_debt_allowed: bool = True,  # should be static
        # TODO: Demand logic will be pulled from another file, either demand.py or person.py.  These values are currently black box standins to enable determine_price logic
        starting_demand_intercept: float = 400.0,
        starting_demand_slope: float = 1.0,
        salary_cost = 100.0,
        equipment_cost = 100.0,
        property_value = 2000.0,
        insurance = 0.0
    ):
        """
        Initialize an IndustryAgent with its starting values.
        """
        super().__init__(model)
        self.industry_type = industry_type
        self.price = starting_price
        self.inventory = starting_inventory
        self.balance = starting_balance
        self.offered_wage = starting_offered_wage
        self.fixed_cost = starting_fixed_cost
        self.raw_mat_cost = starting_raw_mat_cost
        self.num_employees = starting_number_of_employees
        self.worker_efficiency = starting_worker_efficiency
        self.debt_allowed = starting_debt_allowed
        self.demand_intercept = starting_demand_intercept
        self.demand_slope = starting_demand_slope
        self.inventory_available_this_step = 0  # calculated by determine_price
        self.hours_worked = 0  # calculated by produce_goods
        self.total_cost = 0.0
        self.total_revenue = 0.0
        self.salary_cost = salary_cost
        self.equipment_cost = equipment_cost
        self.property_value = property_value
        self.insurance = insurance
        self.goods_produced: int = 0  # Tracker for GDP indicator

    def get_tariffs(self) -> float:
        """
        Get the tariff rate for this industry from the model's tax rates.

        Returns:
            float: The tariff rate for this industry.
        """
        tariffs = self.model.policies.get("tariffs", {})
        return tariffs.get(self.industry_type, 0.0)

    def get_employees(self) -> AgentSet:
        """
        Gets all employees that are employed to this industry.
        """
        return self.model.get_employees(self.industry_type)

    def determine_price(self):
        """
        Description:
            Determines the suggested quantity and price of goods for this tick using pricing strategy
            associated with the industry type
            The suggested quantity is used by produce_goods to determine the number of units produced this tick

            Incorperated in the calculation is the production cap, determined by the maximum amount that employees
            can produce, and the total available funds

        Required Inputs: (These Values must be known before running this function)
            self.demand_intercept (float): intercept of demand graph
            self.demand_slope (float): slope of demand graph
            self.get_variable_cost() requirements:
                self.offered_wage (float): hourly wage of employees
                self.worker_efficiency (float): goods produced per employee, per hour
                self.raw_mat_cost (float): per-unit cost of raw materials
            self.inventory (int): inventory left over from previous tick
            self.get_production_capacity() requirements:
                self.num_employees (int): number of employees employeed by industry
                if debt is not allowed,
                    self.balance must be known
            self.industry_type (IndustryType): defines the pricing strategy


        Updated Variables:
            self.inventory_available_this_step (int): Returns the quantity available for sale this step
                Note: this is different from the total inventory available, which is the leftovers from the
                last tick.  In order to maximize profit, the industry may artificially restrict how much they sell
            self.price (float): Returns the price to sell the suggested quantity
        """  
        skipPriceCap = (self.price == 0) #if simulation is just starting and price is still zero, skip price cap logic
        oldPrice = self.price
        A = float(self.demand_intercept)
        B = float(self.demand_slope)

        # variable cost and marginal cost parameters
        V = float(self.get_variable_cost())  # per-unit variable cost
        m = V  # MC intercept (constant MC here)
        n = 0.0  # MC slope (zero => constant MC)

        # feasible maximum to consider when computing suggested Q:
        # allow selling current inventory plus what production capacity will add this step
        # production capacity is capped by two variables: the number of employees and the total available funds
        Q_max = int(max(0, self.inventory + self.get_production_capacity()))

        Price = self.price
        Suggested_Quantity = self.inventory
        F = self.get_fixed_cost_naiive()
        # Determine pricing strategy
        strategy = INDUSTRY_PRICING[self.industry_type]
        if strategy == PricingType.AVG_COST:
            Suggested_Quantity = avg_cost(A, B, V, float(F))
        elif strategy == PricingType.LINEAR_PROFIT_MAX:
            Suggested_Quantity = linear_profit_max(A, B, m, n)

        # ensure suggested quantity is feasible and non-negative, clamp to [0, Q_max]
        if Suggested_Quantity is None:
            Suggested_Quantity = 0

        Suggested_Quantity = float(max(0, min(Suggested_Quantity, Q_max)))
        # TODO: Implement Logic here to hire more employees if the max_production_capacity is too small to accomodate suggested quantity
        # Note: don't just look at Q_max here, as this number also takes into account if there's insufficient funds to produce at the suggested quantity
        # Instead, just factor in max capacity based on a 40 hour work week with all current employees

        #Set price based on suggested quantity
        Price = linear_price(A,B,Suggested_Quantity)
        

        price_cap_percentage = self.model.policies["price_cap"][self.industry_type]
        if price_cap_percentage is not None and skipPriceCap == False:
            price_cap = oldPrice * (1 + price_cap_percentage)   #price cap is set to a percentage amount higher than the price from the previous tick
            if price_cap < Price:
                Price = price_cap
                if(price_cap <= V): #price cap is less than variable cost, meaning producing anything would result in a net loss
                    Suggested_Quantity = 0
                else:
                    Suggested_Quantity = quantity_from_price(A,B,Price)
        # set results on the instance
        self.price = float(Price)
        # inventory_available_this_step is how many units are expected to be available to sell this step
        self.inventory_available_this_step = round(Suggested_Quantity)

    def produce_goods(self):
        """
        Description:
            Determines the suggested quantity and price of goods for this tick using pricing strategy
            associated with the industry type
            The suggested quantity is used by produce_goods to determine the number of units produced this tick

            Incorperated in the calculation is the production cap, determined by the maximum amount that employees
            can produce, and the total available funds

        Required Inputs: (These Values must be known before running this function)
            self.inventory_available_this_step (int): Quantity that will be sold this step
            self.inventory (int): current inventory on hand
            self.num_employees (int): number of employees employed
            self.worker_efficiency (float): goods produced per employee, per hour
            self.get_variable_cost() requirements:
                self.offered_wage (float): hourly wage of employees
                self.worker_efficiency (float): goods produced per employee, per hour
                self.raw_mat_cost (float): per-unit cost of raw materials

        Updated Variables:
            self.inventory (int): total inventory available after production
            self.balance (float): Funds available after production
            self.goods_produced (int): Number of good produced this cycle. Tracker for indicator calculations.
        """
        Fixed = self.get_fixed_cost_naiive()
        
        # produce needed inventory without re-producing inventory aready in storage
        quantity_to_produce = self.inventory_available_this_step - self.inventory

        if (
            quantity_to_produce <= 0
        ):  # no production this turn, already have enough inventory
            self.hours_worked = 0
            self.total_cost = (
                Fixed
            )  # fixed cost is still factored into losses this tick
            self.balance -= Fixed
            return

        variable_cost_per_unit = self.get_variable_cost()
        total_variable_cost = variable_cost_per_unit * quantity_to_produce

        hours_worked = (
            quantity_to_produce / (self.num_employees * self.worker_efficiency)
            if self.num_employees * self.worker_efficiency > 0
            else 0
        )
        total_hours_worked = hours_worked * self.num_employees
        total_full_hours = self.num_employees * 40
        hours_cut = total_full_hours - total_hours_worked

        self.hours_worked = hours_worked  # update hours worked for each employee this tick.  Assume equal number of hours for each employee for now

        if hours_cut >= 40:
            logging.info(
                f"Total employee work hours reduced by {hours_cut:.1f} to meet production quota."
            )
            # TODO If the number of hours needed can consistently be accomplished by fewer employees, trigger firing.  (call change_employment here!)

        # Update inventory and deduct costs
        self.inventory += quantity_to_produce
        self.goods_produced = quantity_to_produce
        spent_variable = variable_cost_per_unit * quantity_to_produce
        self.total_cost = Fixed + spent_variable
        self.balance = self.balance - self.total_cost 
        logging.info(
            f"Produced {quantity_to_produce:.2f} units; spent_variable={spent_variable:.2f}; "
            f"spent_fixed={Fixed:.2f}; remaining funds {self.balance:.2f}; "
            f"total_hours_worked={quantity_to_produce:.1f}"
        )

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
        minimum_wage = self.model.policies["minimum_wage"]
        if minimum_wage is not None and self.offered_wage < minimum_wage:
            self.offered_wage = minimum_wage
        return self.offered_wage
        # TODO: Implement industry wage logic

    def get_variable_cost(self):
        """
        Description:
            Return variable cost per unit: (wage / efficiency) + raw_material_cost.

            If efficiency <= 0, return float('inf') to signal that per-unit cost is undefined
            (production is impossible / infeasible).
        Required Inputs:
            self.offered_wage (float): hourly wage of employees
            self.worker_efficiency (float): goods produced per employee, per hour
            self.raw_mat_cost (float): per-unit cost of raw materials
        Returns:
            variable_cost (float): variable cost per unit

        """
        try:
            ow = float(self.offered_wage)
            eff = float(self.worker_efficiency)
            rm = float(self.raw_mat_cost)
        except Exception as exc:
            raise ValueError(
                "offered_wage, worker_efficiency, raw_mat_cost must be numeric"
            ) from exc

        # detect NaN / Inf early
        if any(math.isnan(x) for x in (ow, eff, rm)):
            raise ValueError("NaN encountered in cost inputs")
        if any(math.isinf(x) for x in (ow, eff, rm)):
            raise ValueError("Infinite cost/input encountered")

        if eff <= 0.0:
            # semantics: if eff==0 we cannot produce — treat per-unit cost as infinite
            return float("inf")
        
        #Tarriffs/Subsidies logic, treated as direct opposites of one another for now
        #Both modify the cost of raw materials, which is then fed into the variable cost calculation
        #subsidies and tarriffs treated as percentages
        subsidies = self.model.policies["subsidies"][self.industry_type]
        tarriffs = self.model.policies["tariffs"][self.industry_type]
        rawMaterialCostModifier = 0.0
        if subsidies is not None:
            rawMaterialCostModifier -= subsidies    #subsidies reduce the cost of raw materials
        if tarriffs is not None:
            rawMaterialCostModifier += tarriffs     #Tarriffs increase the cost of raw materials
        
        rm += (rm * rawMaterialCostModifier)
        
        variable_cost = (ow / eff) + rm
        
        return variable_cost
    def get_fixed_cost(self):
        """
            update fixed cost based on salary, property cost, insurance, equipment cost, and property tax
        """
        #TODO have property value, salary cost, and equipment cost scale with the level of production 
        property_cost = 0.0
        property_tax = self.model.policies["property_tax"] 
        if property_tax is not None:
            property_cost = self.property_value * property_tax
        
        #NOTE: self.fixed_cost will eventually be phased out.  It is kept now for testing purposes
        #When it is phased out, this function will return a value instead of just updating a variable
        self.fixed_cost = self.salary_cost + property_cost + self.insurance + self.equipment_cost
    def get_fixed_cost_naiive(self) -> float:
        """
            in order to show for now on the frontend that changing property tax will affect the fixed costs,
            This function will directly apply the property tax modifier to the fixed cost value
            
            This function will eventually be removed in favor of get_fixed_cost
            returns:
                naiive_fixed_cost (float)
        """
        property_tax = self.model.policies["property_tax"]
        if property_tax is not None:
            property_cost = self.fixed_cost * property_tax
        return self.fixed_cost + property_cost
        
    def get_production_capacity(self):
        """
        Get production capacity based on workers and funds available.

        Returns an int (capacity in units). If production is infeasible returns 0.
        """
        """
        Description:
            Get production capacity based on workers and funds available.

            Returns an int (capacity in units). If production is infeasible returns 0.
        Required Inputs: 
            self.num_employees (int): number of employees employed by industry
            self.worker_efficiency (float): goods produced per employee, per hour
            self.debt_allowed (bool): whether or not the industry is allowed to go into debt to meet
                                      production capacity
            self.get_variable_cost() requirements:
                self.offered_wage (float): hourly wage of employees
                self.worker_efficiency (float): goods produced per employee, per hour
                self.raw_mat_cost (float): per-unit cost of raw materials
            self.balance (float): total money available
            
        Returns:
            production_capacity (int): depending on debt allowed, either worker capacity limit
                                       or the min of fund cap and worker cap

        """
        Fixed = self.get_fixed_cost_naiive()
        
        # worker_limit: how many units can workers produce this period
        # (num_employees * efficiency * hours_per_worker); hours assumed 40 here
        # clamp at zero and floor to int
        worker_capacity_raw = self.num_employees * self.worker_efficiency * 40
        worker_limit = int(max(0, math.floor(worker_capacity_raw)))

        # handle no worker capacity quickly
        if worker_limit <= 0:
            return 0

        # If industry is allowed to go into debt, skip funds limit check
        if self.debt_allowed:
            return worker_limit
        else:
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
                funds_limit_raw = (
                    self.balance - Fixed
                ) / variable_cost_per_unit
                # if funds_limit_raw is not finite for some reason, fall back to 0
                if not math.isfinite(funds_limit_raw):
                    funds_limit = 0
                else:
                    # clamp to a sensible integer range before floor to avoid overflow
                    # e.g., prevent converting > maxsize ints (though Python int is unbounded, math.floor can choke on inf)
                    funds_limit = int(max(0, math.floor(funds_limit_raw)))
                if Fixed > self.balance:
                    funds_limit = 0
                    # TODO add handler for if fixed cost is more than total money -> Bankruptcy imminent!

            # final capacity is the min of worker limit and funds limit
            return min(worker_limit, funds_limit)

    def set_demand_graph_params(self, A: float, B: float):
        """
            Set the demand graph parameters for the industry.
            Called after demand graph is externally calculated
        args:
            A (float): demand intercept (P at Q=0)
            B (float): demand slope (P = A - B Q), B > 0
        updates:
            self.demand_intercept
            self.demand_slope
        """
        self.demand_intercept = A
        self.demand_slope = B

    def get_weekly_pay(self):
        """
        Helper function for calculating weekly pay for each employee this tick
        """
        return self.hours_worked * self.offered_wage

    def sell_goods(self, quantity: int):
        """
        Reduces the industry's inventory by the specified quantity.

        checked against self.inventory_available_this_step, which designates how much
        industry is allowing for sale this tick

        Args:
            quantity: The amount of goods sold.
        Updated Variables:
            self.inventory (int): reduced by quantity sold
            self.inventory_available_this_step (int): reduced by quantity sold
            self.balance (float): increased by revenue generated by sale
        """
        if quantity <= 0:
            return

        if quantity > self.inventory_available_this_step:
            logging.error(
                f"Attempted to sell {quantity} but only have {self.inventory_available_this_step} available for sale."
            )
            return

        self.inventory -= quantity
        self.inventory_available_this_step -= quantity
        self.balance += quantity * self.price
        self.total_revenue += quantity * self.price
        
    def new_tick(self):
        """
            Run this to reset values that are specific to this tick and aren't adjusted anywhere else
            IDEA: incorporate all functions that need to be run every tick into this?
        """
        #self.total_cost = 0    Actually reset by produce_goods
        self.total_revenue = 0
        
    def get_profit(self) -> float:
        """
        Summary:
            uses cost and revenue values to calculate the profit for this tick.
            Note: make sure to reset total_revenue next tick!
        Returns:
            profit (float): total profit this turn
        """
        profit = self.total_revenue-self.total_cost
        return profit
            
    def deduct_corporate_tax(self):
        """
            Summary: deducts corporate tax from profit generated this turn.  Does not deduct anything if profit was zero
        """
        profit = self.get_profit()
        profit = max(0.0,profit)    #if profit is negative, clamp to zero
        corporate_income_tax = self.model.policies["corporate_income_tax"][self.industry_type]
        if corporate_income_tax is not None and profit > 0:
            taxedAmt = profit * corporate_income_tax
        self.balance -= taxedAmt