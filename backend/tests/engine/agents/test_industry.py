import pytest
from pytest import mark
import logging
from engine.agents.industry import IndustryAgent

from engine.types.industry_type import IndustryType
from engine.types.Pricing_Type import PricingType

@pytest.mark.parametrize("industry_type", list(IndustryType))
def test_get_tariffs(mock_economy_model, industry_type: IndustryType):
    """
    Test for `get_tariffs`.
    Tests that the tariffs obtained for this industry is accurate.

    Args:
        industry_type (IndustryType): the industry be looked at.
        mock_economy_model: a mock model. 
    """

    i_agent = IndustryAgent(mock_economy_model, industry_type=industry_type)
    assert (
        i_agent.get_tariffs() == mock_economy_model.policies["tariffs"][industry_type]
    )


@mark.xfail(reason="TODO.")
def test_get_employees():
    assert False


@mark.xfail(reason="Function not implemented yet.")
def test_determine_price():
    assert False


@mark.xfail(reason="Function not implemented yet.")
def test_produce_goods():
    assert False


@mark.xfail(reason="Function not implemented yet.")
def test_change_employment():
    assert False


@mark.xfail(reason="Function not implemented yet.")
def determine_wages():
    assert False


@pytest.fixture(autouse=True)
def quiet_logging():
    logging.disable(logging.CRITICAL)
    yield
    logging.disable(logging.NOTSET)
def test_max_production_capacity(mock_economy_model):
    """
    Test that production capacity is correctly calculated based on employees and funds.
    """
    ind = IndustryAgent(mock_economy_model, industry_type=IndustryType.AUTOMOBILES,
                       starting_price=0.0,
                       starting_inventory=0,
                       starting_money=10000.0,
                       starting_offered_wage=15.0,
                       starting_fixed_cost=200.0,
                       starting_raw_mat_cost=2.0,
                       starting_number_of_employees=5,
                       starting_worker_efficiency=1.0,
                       starting_pricing_strategy=PricingType.AVG_COST)
    capacity = ind.get_production_capacity()
    # With 5 employees, efficiency 1.0, hours 40, max production = 5 * 1.0 * 40 = 200
    assert capacity == 200
def test_variable_cost_per_unit(mock_economy_model):
    """
    Test the variable cost per unit calculation.
    """
    ind = IndustryAgent(mock_economy_model, industry_type=IndustryType.AUTOMOBILES,
                       starting_price=0.0,
                       starting_inventory=0,
                       starting_money=10000.0,
                       starting_offered_wage=15.0,
                       starting_fixed_cost=200.0,
                       starting_raw_mat_cost=2.0,
                       starting_number_of_employees=5,
                       starting_worker_efficiency=1.0,
                       starting_pricing_strategy=PricingType.AVG_COST)
    calculated_variable_cost = ind.get_variable_cost()
    # variable cost per unit = (Wage / Efficiency) + Raw Material Cost
    expected_variable_cost = (15.0 / 1.0) + 2 # = 17.0
    assert calculated_variable_cost == expected_variable_cost
    
    
    """
    See Linear Profit Max Test for full explanation of testing parameters
    This test is designed to find the price at the breakpoint quantity, where revenue = cost
    In this instance, the parameters have been set up to ensure the suggested quantity is 200, and the suggested price is $18 per unit
    
    
    """
def test_determine_price_avg_cost(mock_economy_model):
    """
    Test determine_price when pricing strategy is AVG_COST.
    avg_cost returns (Price, Quantity) and industry.determine_price sets self.price = Price.
    We'll pick parameters where the quadratic has real roots and the higher root is feasible.
    """
    ind = IndustryAgent(mock_economy_model, industry_type=IndustryType.UTILITIES,
                       starting_price=0.0,
                       starting_inventory=0,
                       starting_money=10000.0,
                       starting_offered_wage=15.0,
                       starting_fixed_cost=200.0,
                       starting_raw_mat_cost=2.0,
                       starting_number_of_employees=5,
                       starting_worker_efficiency=1.0,
                       starting_demand_intercept=36.0,
                       starting_demand_slope=0.09)
    ind.determine_price()
    ind.produce_goods() # Should produce 200 units, which is the break-even quantity
    print(ind.inventory_available_this_step)
    assert ind.price == 18.0



"""
Set up production first:
production = EmpNum * Eff * Hours
Set production to 200, employees to 5, hours to 40
200 = 200 * eff
1 = Efficiency


wage = $15/hr
num employees = 5
hours worked = 40
Total Labor Cost = 15 * 5 * 40 = $3000/week
Arbitrary Fixed cost of $200/week

Production cost:
200 * material price
Set material price to $2
Production cost = 400

Total Cost = Labor + Materials + Fixed = 3000 + 200 + 400 = $3600 / week
Average Cost Per Good Produced = 3600 / 200 = $18
Assume for now that suggested quantity to sell is 200 

Price is determined by 
P = A - (B * Quantity)
Where A is demand intercept & B is demand slope
For now, pick an arbitrary A & B so that price is equal to $18, covering cost
18 = A - 200B
Set A to double production cost = 36
-18 = -200B
B = 0.09

Quantity equation looks like
BQ^2 + (V - A)Q + F = 0
V is variable cost per unit = Wage/efficiency + Material = 15/1 + 2 = 17
F is fixed cost = 200
A is demand intercept = 36
B is demand slope = 0.09
0.09Q^2 + (17 - 36)Q + F
Q1 = 11.11 Q2 = 200

Linear Profit Max = 
(A - V / 2B) = Q
(36 - 17) / (2*0.09) = 105.55 ~= 106
P_at_Q = A - B * Q
P_at_Q = 36 - 106(0.09) = $26.46    
106 * 26.46 = $2805.96 revenue

Total Cost = Variable + Fixed
Variable = 106 * 17 = 1802
Fixed = 200
Total Cost = 2002

profit = 2805.96 - 2002 = $803.96 profit!
    
"""
def test_determine_price_linear_profit_max(mock_economy_model):
    """
    Test determine_price when pricing strategy is LINEAR_PROFIT_MAX.
    linear profit max suggests selling 106 units at $26.46/unit.
    This test checks that the price determined matches the linear profit max calculation.
    """
    ind = IndustryAgent(mock_economy_model,industry_type=IndustryType.LUXURY,
                       starting_price=0.0,
                       starting_inventory=0,
                       starting_money=10000.0,
                       starting_offered_wage=15.0,
                       starting_fixed_cost=200.0,
                       starting_raw_mat_cost=2.0,
                       starting_number_of_employees=5,
                       starting_worker_efficiency=1.0,
                       starting_demand_intercept=36.0,
                       starting_demand_slope=0.09)
    ind.determine_price()
    ind.produce_goods()
    print(ind.inventory_available_this_step)
    assert ind.price == 26.46
