from pytest import mark, approx, param
from engine.core.model import EconomyModel
from engine.agents.person import PersonAgent
from engine.agents.industry import IndustryAgent
from engine.types.industry_type import IndustryType
import engine.core.indicators as indicators


def test_get_week(model: EconomyModel):
    """
    Test for `get_week`.
    Tests that the week increments upon the model stepping.

    Args:
        model (EconomyModel): a freshly created model.
    """
    assert model.get_week() == 0
    model.step()
    assert model.get_week() == 1


def test_calculate_unemployment(model: EconomyModel):
    """
    Test for `calculate_unemployment`.
    Tests that unemployment indicator updates as employment does.

    Args:
        model (EconomyModel): a freshly created model.
    """
    assert indicators.calculate_unemployment(model) == 1.0

    # TODO: redo whenever starting unemployment logic has been updated
    peopleAgents = model.agents_by_type[PersonAgent]
    total = len(peopleAgents)
    employed = 5
    for agent in list(peopleAgents)[:employed]:
        agent.employer = IndustryType.AUTOMOBILES

    expected_unemployment = float((total - employed) / total)
    assert indicators.calculate_unemployment(model) == expected_unemployment


@mark.parametrize(
    "production, price, expected",
    [
        ([0, 0, 0], [100, 50, 75], 0.0),  # No production = 0 GDP
        ([10, 0, 0], [100, 50, 75], 1000.0),  # Only one industry
        ([10, 5, 20], [100, 50, 75], 2750.0),  # Mixed production
        ([100, 100, 100], [1, 1, 1], 300.0),  # Low prices, high volume
    ],
)
def test_calculate_gdp(model: EconomyModel, production, price, expected):
    """
    Tests that GDP is correctly calculated as the sum of (production × price)
    across all industries.

    Args:
        model (EconomyModel): a freshly created model.
    """

    industryAgents = model.agents_by_type[IndustryAgent]

    for i, industry in enumerate(industryAgents):
        if i < len(production):
            industry.goods_produced = production[i]
            industry.price = price[i]
        else:
            industry.goods_produced = 0

    calculated_gdp = indicators.calculate_gdp(model)
    assert calculated_gdp == approx(expected)


@mark.parametrize(
    "incomes,expected",
    [
        param([20] * 10, 20.0, id="Same incomes"),
        param([0] * 10, 0.0, id="Zero (same) incomes"),
        param([0, 2, 4, 6, 8, 10, 12, 14, 16, 18], 9.0, id="Different incomes"),
        param(
            [5, 12, 19, 21, 32, 51, 68, 87, 92, 100],
            48.7,
            id="Different incomes(bigger range)",
        ),
        param([0] * 9 + [100], 10.0, id="Unequal incomes"),
    ],
)
def test_calculate_income_per_capita(
    model: EconomyModel, incomes: list, expected: float
):
    """
    Tests `calculate_income_per_capita`'s accuracy across different ranges of incomes.

    Args:
        model (EconomyModel): a freshly created model.
        incomes (list): a list of the incomes of the PersonAgents.
        expected (float): the expected value by the calculation.
    """

    peopleAgents = model.agents_by_type[PersonAgent]
    for i, agent in enumerate(peopleAgents):
        agent.income = incomes[i]

    assert expected == indicators.calculate_income_per_capita(model)


@mark.parametrize(
    "incomes,expected",
    [
        param([20] * 10, 20.0, id="Same incomes"),
        param([0] * 10, 0.0, id="Zero (same) incomes"),
        param([0, 2, 4, 6, 8, 10, 12, 14, 16, 18], 9.0, id="Different incomes"),
        param(
            [5, 12, 19, 21, 32, 51, 68, 87, 92, 100],
            41.5,
            id="Different incomes(bigger range)",
        ),
        param([0] * 9 + [100], 0.0, id="Unequal incomes"),
    ],
)
def test_calculate_median_income(model: EconomyModel, incomes: list, expected: float):
    """
    Tests `calculate_median_income`'s accuracy across different ranges of incomes.

    Args:
        model (EconomyModel): a freshly created model.
        incomes (list): a list of the incomes of the PersonAgents.
        expected (float): the expected value by the calculation.
    """

    peopleAgents = model.agents_by_type[PersonAgent]
    for i, agent in enumerate(peopleAgents):
        agent.income = incomes[i]

    assert expected == indicators.calculate_median_income(model)


@mark.parametrize(
    "incomes,expected",
    [
        param([20] * 10, 20.0, id="Same incomes"),
        param([0] * 10, 0.0, id="Zero (same) incomes"),
        param([0, 2, 4, 6, 8, 10, 12, 14, 16, 18], 9.0, id="Different incomes"),
        param(
            [5, 12, 19, 21, 32, 51, 68, 87, 92, 100],
            41.5,
            id="Different incomes(bigger range)",
        ),
        param([0] * 9 + [100], 0.0, id="Unequal incomes"),
    ],
)
def test_calculate_hoover_index(model: EconomyModel, incomes: list, expected: float):
    """
    Tests `calculate_hoover_index`'s accuracy across different ranges of incomes.

    Args:
        model (EconomyModel): a freshly created model.
        incomes (list): a list of the incomes of the PersonAgents.
        expected (float): the expected value by the calculation.
    """
    peopleAgents = model.agents_by_type[PersonAgent]
    for i, agent in enumerate(peopleAgents):
        agent.income = incomes[i]

    # assert expected == indicators.calculate_hoover_index(model)
    # TODO: Calculate Hoover Index for the incomes, and change the expected value in params accordingly
    # TODO: More tests cases might be required


@mark.parametrize(
    "balances, expected, round",
    [
        param([], {"x": [0, 1], "y": [0, 1]}, False, id="no agents/equality"),
        param(
            [100, 100, 100, 100],
            {
                "x": [0.0, 0.25, 0.50, 0.75, 1.0],
                "y": [0.0, 0.25, 0.50, 0.75, 1.0],
            },  # Curve should be a perfect linear line with slope of 1; x = y
            False,
            id="perfect equality",
        ),
        param(
            [0, 0, 0, 100],
            {
                "x": [0.0, 0.25, 0.50, 0.75, 1.0],
                "y": [0.0, 0.0, 0.0, 0.0, 1.0],
            },  # Curve should run along x-axis until the final personAgent
            True,
            id="perfect inequality",
        ),
        param(
            [10, 20, 30, 40],
            {
                "x": [0.0, 0.25, 0.50, 0.75, 1.0],
                "y": [0.0, 0.10, 0.30, 0.60, 1.0],
            },  # Cumulative balance shares: [10/100, (10+20)/100, (10+20+30)/100, 100/100]
            True,
            id="standard unequal distribution",
        ),
    ],
)
def test_lorenz_curve(
    indicator_test_model_factory, balances: list, expected: dict, round: bool
):
    model = indicator_test_model_factory(balances=balances)
    result = indicators.calculate_lorenz_curve(model)
    if round:
        assert result["x"] == approx(expected["x"])
        assert result["y"] == approx(expected["y"])
    else:
        assert result == expected


# -- Gini Coefficient Test Suite --
def test_gini_coefficient_no_agents(indicator_test_model_factory):
    """Test Gini coefficient with zero agents should be 0."""
    model = indicator_test_model_factory(balances=[])
    assert indicators.calculate_gini_coefficient(model) == approx(0.0)


def test_gini_coefficient_perfect_equality(indicator_test_model_factory):
    """Test Gini coefficient with perfect wealth equality should be 0."""
    model = indicator_test_model_factory(balances=[100, 100, 100, 100])
    assert indicators.calculate_gini_coefficient(model) == approx(0.0)


def test_gini_coefficient_all_zero_balance(indicator_test_model_factory):
    """Test Gini coefficient where all agents have zero balance (a form of equality)."""
    model = indicator_test_model_factory(balances=[0, 0, 0, 0])
    assert indicators.calculate_gini_coefficient(model) == approx(0.0)


def test_gini_coefficient_perfect_inequality(indicator_test_model_factory):
    """Test Gini coefficient with perfect wealth inequality."""
    # For N agents, the max Gini is (N-1)/N
    model = indicator_test_model_factory(balances=[0, 0, 0, 100])
    expected_gini = (4 - 1) / 4  # 0.75
    assert indicators.calculate_gini_coefficient(model) == approx(expected_gini)


def test_gini_coefficient_typical_case(indicator_test_model_factory):
    """Test Gini coefficient with a standard, unequal distribution of wealth."""
    model = indicator_test_model_factory(balances=[10, 20, 30, 40])
    # The known Gini coefficient for this distribution is 0.25
    assert indicators.calculate_gini_coefficient(model) == approx(0.25)
