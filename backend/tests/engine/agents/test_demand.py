from engine.types.demographic import Demographic, DEMOGRAPHIC_SIGMAS
from engine.types.industry_type import IndustryType
from engine.agents.demand import demand_func, custom_round
from pytest import approx


def test_demand_func():
    """
    Tests the `demand_func` with sigma=1, which simplifies to the Cobb-Douglas case.
    In this case, an agent spends a percentage of their budget on a good
    equal to their preference weight for it.
    """

    preferences = {IndustryType.ENTERTAINMENT: 0.6, IndustryType.GROCERIES: 0.4}
    prices = {IndustryType.ENTERTAINMENT: 10.0, IndustryType.GROCERIES: 25.0}
    budget = 1000.0

    demands = demand_func(
        DEMOGRAPHIC_SIGMAS[Demographic.UPPER_CLASS], budget, preferences, prices
    )

    # Expected food: (1000 * 0.6) / 10 = 60 units
    # Expected clothing: (1000 * 0.4) / 25 = 16 units
    assert demands[IndustryType.ENTERTAINMENT] == approx(60.0)
    assert demands[IndustryType.GROCERIES] == approx(16.0)

def test_custom_round():
    pass