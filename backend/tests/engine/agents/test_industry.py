import pytest
from pytest import mark

import math
from engine.agents.industry import IndustryAgent

from engine.types.industry_type import IndustryType
from engine.types.pricing_type import PricingType

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
def test_produce_goods():
    assert False


@mark.xfail(reason="Function not implemented yet.")
def test_change_employment():
    assert False


@mark.xfail(reason="Function not implemented yet.")
def determine_wages():
    assert False



def test_max_production_capacity(mock_economy_model):
    """
    Test that production capacity is correctly calculated based on employees and funds.
    """
    ind = IndustryAgent(mock_economy_model, industry_type=IndustryType.AUTOMOBILES,
                       starting_price=0.0,
                       starting_inventory=0,
                       starting_balance=10000.0,
                       starting_offered_wage=15.0,
                       starting_fixed_cost=200.0,
                       starting_raw_mat_cost=2.0,
                       starting_number_of_employees=5,
                       starting_worker_efficiency=1.0,
                       starting_demand_intercept=36.0,
                       starting_demand_slope=0.09
                       )
    capacity = ind.get_production_capacity()
    # With 5 employees, efficiency 1.0, hours 40, max production = 5 * 1.0 * 40 = 200
    assert capacity == 200
def test_max_production_capacity_no_debt(mock_economy_model):
    """
    Test that production capacity is correctly calculated based on employees and funds.
    This test will limit production capacity by the total available funds, and not allow debt
    -Note: this is dangerous, as it can cause industries to go into bankruptcy a lot quicker.
    This is because it's more likely that an industry agent near the edge will not be able to produce
    a profitable quantity.
    
    For example, in this case, the company has to make at least 12 units (breakpoint at 11.11) to be profitable.
    However, due to limited funds, they can only produce 5 units
    """
    ind = IndustryAgent(mock_economy_model, industry_type=IndustryType.AUTOMOBILES,
                       starting_price=0.0,
                       starting_inventory=0,
                       starting_balance=300.0,
                       starting_offered_wage=15.0,
                       starting_fixed_cost=200.0,
                       starting_raw_mat_cost=2.0,
                       starting_number_of_employees=5,
                       starting_worker_efficiency=1.0,
                       starting_debt_allowed=False,
                       starting_demand_intercept=36.0,
                       starting_demand_slope=0.09
                       )
    capacity = ind.get_production_capacity()
    # With 5 employees, efficiency 1.0, hours 40, max production = 5 * 1.0 * 40 = 200
    # However, Available funds limits this: (Total Funds - Fixed Cost) / Variable Cost = 100 / 17 = 5.88 ~= 5
    assert capacity == 5
def test_variable_cost_per_unit(mock_economy_model):
    """
    Test the variable cost per unit calculation.
    """
    ind = IndustryAgent(mock_economy_model, industry_type=IndustryType.AUTOMOBILES,
                       starting_price=0.0,
                       starting_inventory=0,
                       starting_balance=10000.0,
                       starting_offered_wage=15.0,
                       starting_fixed_cost=200.0,
                       starting_raw_mat_cost=2.0,
                       starting_number_of_employees=5,
                       starting_worker_efficiency=1.0)
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
                       starting_balance=10000.0,
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
Set production to 200, employees to 50, hours to 40
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
                       starting_balance=10000.0,
                       starting_offered_wage=15.0,
                       starting_fixed_cost=200.0,
                       starting_raw_mat_cost=2.0,
                       starting_number_of_employees=5,
                       starting_worker_efficiency=1.0,
                       starting_demand_intercept=36.0,
                       starting_demand_slope=0.09)
    ind.determine_price()
    ind.produce_goods()
    assert ind.price == 26.46, ind.inventory_available_this_step == 106
def test_starting_inventory_satisfies_demand(mock_economy_model):
    """
    Test determine_price when pricing strategy is LINEAR_PROFIT_MAX, but inventory satisfies demand.
    linear profit max suggests selling 106 units at $26.46/unit.
    
    Same price and quantity sold, but nothing produced
    
    """
    ind = IndustryAgent(mock_economy_model,industry_type=IndustryType.LUXURY,
                       starting_price=0.0,
                       starting_inventory=1000,
                       starting_balance=10000.0,
                       starting_offered_wage=15.0,
                       starting_fixed_cost=200.0,
                       starting_raw_mat_cost=2.0,
                       starting_number_of_employees=5,
                       starting_worker_efficiency=1.0,
                       starting_demand_intercept=36.0,
                       starting_demand_slope=0.09)
    ind.determine_price()
    ind.produce_goods()
    weekly_pay = ind.get_weekly_pay()
    assert ind.price == 26.46
    assert ind.inventory_available_this_step == 106
    assert ind.hours_worked == 0
    assert ind.offered_wage == 15.0
    assert weekly_pay == 0.0
"""
Try negative val for this:
(V-A)^2) - 4(B*F)
Wage: 15/hr
eff: 1
raw mat: 2
V: $17
Demand Int:
A: 19

(V-A)^2 = (17-19)^2 = -2^2 = 4

Demand Slope:
B = 0.5
Fixed Cost:
F = 10

4(B*F) = 4(0.5 * 10) = 4(5) = 20
4-20 = -16  
2 +- 4i <- complex conjugate roots
V-A = 17 - 19 =  (-1)-2 = 2 / 2(0.5) = 2


 Q = (A - V) / (2B)
19-17 = 2 / 2 * 0.5 = 2 = sell 2
P = A - B * Q
19 - 0.5 * 2 = $18    
    
"""
def test_avg_cost_linear_profit_fallback(mock_economy_model):
    """
    Test determine_price and produce_goods with Average Cost pricing strategy,
    but triggering the linear profit max fallback.  This is done by ensuring the 
    quadratic has complex conjugate roots.
    This essentially means there are no profitable quantities, so the industry will find the price and
    quantity with the least amount of loss.
    linear profit max suggests selling 2 units at $18.
    This test checks that the price and quantity determined matches the linear profit max calculation.
    """
    ind = IndustryAgent(mock_economy_model,industry_type=IndustryType.UTILITIES,
                       starting_price=0.0,
                       starting_inventory=0,
                       starting_balance=10000.0,
                       starting_offered_wage=15.0,
                       starting_fixed_cost=10.0,
                       starting_raw_mat_cost=2.0,
                       starting_number_of_employees=5,
                       starting_worker_efficiency=1.0,
                       starting_demand_intercept=19.0,
                       starting_demand_slope=0.5)
    ind.determine_price()
    ind.produce_goods()
    assert ind.price == 18, ind.inventory_available_this_step == 2

def test_get_weekly_pay(mock_economy_model):
    """
    Using the first test scenario, calculate how much each worker is going to get paid this week
    linear profit max suggests selling 106 units at $26.46/unit.
    This test checks that the price determined matches the linear profit max calculation.
    """
    ind = IndustryAgent(mock_economy_model,industry_type=IndustryType.LUXURY,
                       starting_price=0.0,
                       starting_inventory=0,
                       starting_balance=10000.0,
                       starting_offered_wage=15.0,
                       starting_fixed_cost=200.0,
                       starting_raw_mat_cost=2.0,
                       starting_number_of_employees=5,
                       starting_worker_efficiency=1.0,
                       starting_demand_intercept=36.0,
                       starting_demand_slope=0.09)
    #106 units produced at an efficiency of 1, meaning 106 hours worked in total
    #Total Hours/Num Employees = 106 / 5 = 21.2 hours
    #Hours worked per employee * offered wage = 21.2 * 15 = 318 dollars, tax not included
    ind.determine_price()
    ind.produce_goods()
    weekly_pay = ind.get_weekly_pay()
    assert weekly_pay == 318.00
    
def test_determine_price_realistic(mock_economy_model):
    """
    Test determine_price when pricing strategy is LINEAR_PROFIT_MAX.
    This test uses more realistic values for a large industry
    This test checks that the price and quantity determined matches the linear profit max calculation.
    """
    ind = IndustryAgent(mock_economy_model,industry_type=IndustryType.LUXURY,
                       starting_price=0.0,
                       starting_inventory=0,
                       starting_balance=1000000.0,
                       starting_offered_wage=20.0,
                       starting_fixed_cost=4000.0,
                       starting_raw_mat_cost=5.0,
                       starting_number_of_employees=20,
                       starting_worker_efficiency=50.0,
                       starting_demand_intercept=25.0,
                       starting_demand_slope=0.001)
    ind.determine_price()
    ind.produce_goods()
    assert ind.price == 15.2, ind.inventory_available_this_step == 9800
    
    
"""
===============================================================================
Test Suite: get_variable_cost()
===============================================================================

Description:
    This test suite validates the correctness and robustness of the
    IndustryAgent.get_variable_cost() method. The method computes the per-unit
    variable cost of production using the formula:

        variable_cost = (offered_wage / worker_efficiency) + raw_material_cost

    It accounts for both normal and abnormal input conditions, and handles
    infeasible or undefined production scenarios by returning infinity (float('inf')).

Test Coverage:
    1. **Normal Operation**
        - Valid numeric inputs with typical values.
        - Ensures formula correctness and rounding consistency.

    2. **Boundary Conditions**
        - Zero or near-zero efficiency values (division edge cases).
        - Zero or negative efficiency values should yield infinity.
        - Extremely high cost or inefficiency scenarios.

    3. **Invalid Inputs**
        - Non-numeric inputs (e.g., strings).
        - NaN (Not a Number) or infinite float values should raise ValueError.

    4. **Parameterization**
        - All tests use a shared factory method `make_industry_agent()` to create
          IndustryAgent instances with only the relevant cost parameters varied.
        - The test suite accepts a `mock_economy_model` fixture to decouple tests
          from any real economic model dependencies.


Expected Behavior Summary:
    - Returns correct numeric output for feasible inputs.
    - Returns float('inf') when efficiency <= 0.
    - Raises ValueError when encountering NaN, Inf, or non-numeric values.

===============================================================================
"""

# factory function
def make_industry_agent(mock_economy_model, wage, efficiency, raw_cost):
    return IndustryAgent(
        mock_economy_model,
        industry_type=IndustryType.LUXURY,
        starting_price=0.0,
        starting_inventory=0,
        starting_balance=1000000.0,
        starting_offered_wage=wage,
        starting_fixed_cost=4000.0,
        starting_raw_mat_cost=raw_cost,
        starting_number_of_employees=20,
        starting_worker_efficiency=efficiency,
        starting_demand_intercept=25.0,
        starting_demand_slope=0.001
    )

# ---- TESTS ----

def test_normal_case(mock_economy_model):
    ind = make_industry_agent(mock_economy_model, 20, 10, 5)
    assert ind.get_variable_cost() == pytest.approx(7.0)

def test_zero_wage(mock_economy_model):
    ind = make_industry_agent(mock_economy_model, 0, 10, 5)
    assert ind.get_variable_cost() == pytest.approx(5.0)

def test_extremely_low_efficiency(mock_economy_model):
    ind = make_industry_agent(mock_economy_model, 20, 1e-6, 3)
    assert math.isclose(ind.get_variable_cost(), 20000003, rel_tol=1e-6)

def test_zero_efficiency_returns_inf(mock_economy_model):
    ind = make_industry_agent(mock_economy_model, 20, 0, 3)
    assert math.isinf(ind.get_variable_cost())

def test_negative_efficiency_returns_inf(mock_economy_model):
    ind = make_industry_agent(mock_economy_model, 20, -5, 4)
    assert math.isinf(ind.get_variable_cost())

def test_nan_input_raises(mock_economy_model):
    ind = make_industry_agent(mock_economy_model, 20, float('nan'), 5)
    with pytest.raises(ValueError):
        ind.get_variable_cost()

def test_inf_input_raises(mock_economy_model):
    ind = make_industry_agent(mock_economy_model, 20, 10, float('inf'))
    with pytest.raises(ValueError):
        ind.get_variable_cost()

def test_non_numeric_input_raises(mock_economy_model):
    ind = make_industry_agent(mock_economy_model, "abc", 10, 5)
    with pytest.raises(ValueError):
        ind.get_variable_cost()

"""
Test Suite: get_production_capacity()

These tests validate that the IndustryAgent.get_production_capacity() method correctly computes
how many units an industry can produce given its workforce, efficiency, costs, and available funds.

Test Coverage:
1. Normal Behavior — verifies that production capacity matches expected limits when funds and efficiency are normal.
2. Debt Allowed — ensures that when debt is permitted, only the worker limit is applied.
3. Worker Constraints — covers cases with zero or negative employees or efficiency.
4. Financial Constraints — tests behavior when available money is low, costs are infinite, or fixed cost exceeds total money.
5. Invalid Variable Cost Handling — ensures that infinite, zero, or non-finite cost values result in zero capacity safely.

Each test uses the helper function make_industry_agent(), which sets up a consistent IndustryAgent instance
with controlled input parameters. The mock_economy_model fixture is passed to maintain independence and integration
compatibility with the larger simulation system.
"""


# --- Factory Helper for Consistent IndustryAgent Setup ---
def make_industry_agent_production(
    mock_economy_model,
    wage,
    efficiency,
    raw_cost,
    num_employees=20,
    total_money=1000000.0,
    fixed_cost=4000.0,
    debt_allowed=True
):
    ind = IndustryAgent(
        mock_economy_model,
        industry_type=IndustryType.LUXURY,
        starting_price=0.0,
        starting_inventory=0,
        starting_balance=total_money,
        starting_offered_wage=wage,
        starting_fixed_cost=fixed_cost,
        starting_raw_mat_cost=raw_cost,
        starting_number_of_employees=num_employees,
        starting_worker_efficiency=efficiency,
        starting_demand_intercept=25.0,
        starting_demand_slope=0.001,
        starting_debt_allowed=debt_allowed
        # If your constructor supports a starting_debt_allowed kwarg, you can pass it:
        # starting_debt_allowed=debt_allowed,
    )
    return ind


# --- Test Cases ---

def test_normal_capacity(mock_economy_model):
    """Normal case: efficiency and funds sufficient -> funds not limiting."""
    ind = make_industry_agent_production(mock_economy_model, wage=20, efficiency=10, raw_cost=5)
    cap = ind.get_production_capacity()
    # Worker limit = 20 employees * 10 efficiency * 40 hours = 8000 units
    assert cap == 8000


def test_debt_allowed_ignores_funds(mock_economy_model):
    """When debt is allowed, capacity equals worker limit regardless of money."""
    ind = make_industry_agent_production(
        mock_economy_model, wage=20, efficiency=10, raw_cost=5, total_money=0, debt_allowed=True
    )
    cap = ind.get_production_capacity()
    assert cap == 20 * 10 * 40  # worker-based only


def test_low_money_limits_capacity(mock_economy_model):
    """
    With debt_allowed=False and very low total_money, funds limit should constrain capacity.
    Worker limit = 20 * 10 * 40 = 8000, but funds limit will be <= 0 -> final capacity 0.
    """
    ind = make_industry_agent_production(
        mock_economy_model,
        wage=20,
        efficiency=10,
        raw_cost=5,
        total_money=1000,   # small funds
        fixed_cost=4000,    # fixed cost more than money -> funds_limit <= 0
        debt_allowed=False
    )
    assert ind.get_production_capacity() == 0


def test_zero_employees_returns_zero(mock_economy_model):
    """Zero employees means no production capacity."""
    ind = make_industry_agent_production(mock_economy_model, wage=20, efficiency=10, raw_cost=5, num_employees=0)
    assert ind.get_production_capacity() == 0


def test_zero_efficiency_returns_zero(mock_economy_model):
    """Zero worker efficiency means no production."""
    ind = make_industry_agent_production(mock_economy_model, wage=20, efficiency=0, raw_cost=5)
    assert ind.get_production_capacity() == 0


def test_negative_efficiency_returns_zero(mock_economy_model):
    """Negative efficiency should clamp capacity to 0."""
    ind = make_industry_agent_production(mock_economy_model, wage=20, efficiency=-5, raw_cost=5)
    assert ind.get_production_capacity() == 0


def test_infinite_variable_cost(mock_economy_model, monkeypatch):
    """
    If get_variable_cost returns inf and debt_allowed=False, funds-based production is impossible -> 0.
    """
    ind = make_industry_agent_production(
        mock_economy_model,
        wage=20,
        efficiency=10,
        raw_cost=5,
        total_money=1000000,
        fixed_cost=4000,
        debt_allowed=False
    )
    monkeypatch.setattr(ind, "get_variable_cost", lambda: float("inf"))
    assert ind.get_production_capacity() == 0


def test_zero_variable_cost(mock_economy_model, monkeypatch):
    """
    If get_variable_cost returns 0.0 or negative (invalid for funds check) and debt_allowed=False,
    funds_limit is treated as 0 -> final capacity 0.
    """
    ind = make_industry_agent_production(
        mock_economy_model,
        wage=20,
        efficiency=10,
        raw_cost=5,
        total_money=1000000,
        fixed_cost=4000,
        debt_allowed=False
    )
    monkeypatch.setattr(ind, "get_variable_cost", lambda: 0.0)
    assert ind.get_production_capacity() == 0


def test_non_finite_funds_limit(mock_economy_model, monkeypatch):
    """If variable cost returns a finite number but leads to infinite funds limit, clamp to 0."""
    ind = make_industry_agent_production(mock_economy_model, wage=20, efficiency=10, raw_cost=5)
    # simulate division by an extremely small cost to trigger overflow
    monkeypatch.setattr(ind, "get_variable_cost", lambda: 1e-300)
    cap = ind.get_production_capacity()
    assert cap > 0  # it should still produce, but capped by worker limit
    assert cap <= 20 * 10 * 40


def test_fixed_cost_greater_than_money(mock_economy_model):
    """
    If fixed_cost > total_money and debt_allowed=False, funds_limit becomes zero -> final capacity 0.
    """
    ind = make_industry_agent_production(
        mock_economy_model,
        wage=20,
        efficiency=10,
        raw_cost=5,
        total_money=1000,
        fixed_cost=2000,
        debt_allowed=False
    )
    assert ind.get_production_capacity() == 0