from engine.types.demographic import Demographic, DEMOGRAPHIC_SIGMAS
from engine.types.industry_type import IndustryType
from engine.agents.demand import demand_func, custom_round
from pytest import approx, mark, param


@mark.parametrize(
    "x,expected",
    [
        param(0.0, 0),
        param(0.1, 0),
        param(0.949999, 0),
        param(0.95, 1),
        param(0.952, 1),
        param(3 * 2.33, 7),
    ],
)
def test_custom_round(x: float, expected: int):
    """
    Tests `custom_round` with various floats.

    Args:
        x (float): the number to be rounded.
        expected (int): The expected integer after rounding.
    """
    result = custom_round(x)
    assert result == expected


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
