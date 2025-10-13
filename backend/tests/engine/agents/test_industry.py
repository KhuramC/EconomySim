import pytest
from pytest import mark
import logging
from engine.agents.industry import IndustryAgent

from engine.types.industry_type import IndustryType
from engine.types.Pricing_Type import PricingType

@pytest.mark.parametrize("industry_type", list(IndustryType))
def test_get_tariffs(industry_type: IndustryType, mock_economy_model):

    i_agent = IndustryAgent(mock_economy_model, industry_type=industry_type)
    assert (
        i_agent.get_tariffs() == mock_economy_model.tax_rates["tariffs"][industry_type]
    )


@mark.skip(reason="TODO.")
def test_get_employees():
    pass


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

class DummyModel:
	def __init__(self, num_employees=0, tariffs=None):
		# simple tax_rates mapping matching what IndustryAgent expects
		if tariffs is None:
			tariffs = {itype: 0.0 for itype in IndustryType}
		self.tax_rates = {"tariffs": tariffs}
		# create a simple list of dummy employee placeholders
		self._employees = [object() for _ in range(num_employees)]

	def get_employees(self, industry_type):
		# return our simple list (IndustryAgent only uses len())
		return self._employees

def test_determine_price_linear_profit_max_sets_price():
	logging.getLogger().setLevel(logging.CRITICAL)
	model = DummyModel(num_employees=0)
	# start with inventory large enough so Q* (25) is feasible
	agent = IndustryAgent(
		model=model,
		industry_type=IndustryType.GROCERIES,
		starting_price=0.0,
		starting_inventory=50,
		starting_money=1000.0,
		starting_offered_wage=0.0,
		starting_fixed_cost=0.0,
		starting_variable_cost=0.0,
		pricing_strategy=PricingType.LINEAR_PROFIT_MAX,
	)

	agent.determine_price()

	# For placeholders A=100, B=2, m=0, n=0 the optimum Q* = (A-m)/(2B+n) = 25 -> P = 100-2*25 = 50
	assert agent.price == 50

def test_produce_goods_sufficient_funds():
	logging.getLogger().setLevel(logging.CRITICAL)
	# 2 employees; intended_qty = 2; variable_cost=5, fixed_cost=10, total_money=100
	model = DummyModel(num_employees=2)
	agent = IndustryAgent(
		model=model,
		industry_type=IndustryType.GROCERIES,
		starting_price=10.0,
		starting_inventory=0,
		starting_money=100.0,
		starting_offered_wage=0.0,
		starting_fixed_cost=10.0,
		starting_variable_cost=5.0,
		pricing_strategy=PricingType.AVG_COST,
	)

	agent.produce_goods()

	# intended_qty = 2, so inventory should increase by 2
	assert agent.inventory == 2
	# funds should decrease by fixed + variable*2 = 10 + 5*2 = 20
	assert abs(agent.total_money - 80.0) < 1e-8

def test_produce_goods_insufficient_funds_for_fixed():
	logging.getLogger().setLevel(logging.CRITICAL)
	# no employees (intended 15), total_money < fixed_cost
	model = DummyModel(num_employees=0)
	agent = IndustryAgent(
		model=model,
		industry_type=IndustryType.GROCERIES,
		starting_price=10.0,
		starting_inventory=5,
		starting_money=5.0,
		starting_offered_wage=0.0,
		starting_fixed_cost=10.0,
		starting_variable_cost=5.0,
		pricing_strategy=PricingType.AVG_COST,
	)

	agent.produce_goods()

	# production should be adjusted to 0 due to insufficient funds for fixed cost
	assert agent.inventory == 5
	# total_money should have reduced by fixed cost (allowing debt): 5 - 10 = -5
	assert abs(agent.total_money - (-5.0)) < 1e-8
