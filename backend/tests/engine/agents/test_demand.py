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


@mark.parametrize(
    "sigma,budget,preferences,prices,expected",
    [
        param(
            1,
            1000,
            {IndustryType.ENTERTAINMENT: 0.6, IndustryType.GROCERIES: 0.4},
            {IndustryType.ENTERTAINMENT: 10.0, IndustryType.GROCERIES: 25.0},
            {IndustryType.ENTERTAINMENT: 60.0, IndustryType.GROCERIES: 16.0},
            # Expected food: (1000 * 0.6) / 10 = 60 units; Expected clothing: (1000 * 0.4) / 25 = 16 units
            id="Regular",
        )
    ],
)
def test_demand_func(
    sigma: float,
    budget: float,
    preferences: dict[IndustryType, float],
    prices: dict[IndustryType, float],
    expected: dict[IndustryType, float],
):
    """
    Tests the `demand_func` with different values.

    Args:
        sigma (float): The elasticity of substitution
        budget (float): The total money available to spend.
        preferences (dict[IndustryType, float]): The preference weights for the available goods/industries.
        prices (dict[IndustryType, float]): The prices of the available goods.
        expected (dict[IndustryType, float]): The expected number of goods for each industry
    """

    demands = demand_func(sigma, budget, preferences, prices)

    for industry, demand in demands.items():
        assert demand == approx(expected[industry])
