from pytest import mark, approx, param
from engine.core.model import EconomyModel
from engine.agents.person import PersonAgent
from engine.agents.industry import IndustryAgent
from engine.types.industry_type import IndustryType
from engine.types.demographic import Demographic
from math import isnan
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
        param([20] * 10, 0.0, id="Same incomes"),
        param([0] * 10, 0.0, id="Zero (same) incomes"),
        param(
            [0, 2, 4, 6, 8, 10, 12, 14, 16, 18], 0.2777777777, id="Different incomes"
        ),
        param(
            [5, 12, 19, 21, 32, 51, 68, 87, 92, 100],
            0.3172484599,
            id="Different incomes(bigger range)",
        ),
        param([0] * 9 + [100], 0.9, id="Unequal incomes"),
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

    assert expected == approx(indicators.calculate_hoover_index(model))


@mark.parametrize(
    "balances, expected, approximate",
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
def test_calculate_lorenz_curve(
    indicator_test_model_factory_balance,
    balances: list,
    expected: dict,
    approximate: bool,
):
    """
    Tests for `calculate_lorenz_curve`. Tests against variety of balance distributions.

    Args:
        indicator_test_model_factory (_type_): a factory to create a model with specific balances easily.
        balances (list): the balances of the PersonAgents.
        expected (dict): the expected Lorenz Curve calculation.
        approximate (bool): whether to approximate or ask for exactness.
    """
    model = indicator_test_model_factory_balance(balances=balances)
    result = indicators.calculate_lorenz_curve(model)
    if approximate:
        assert result["x"] == approx(expected["x"])
        assert result["y"] == approx(expected["y"])
    else:
        assert result == expected


@mark.parametrize(
    "balances, expected",
    [
        param([], 0.0, id="no agents"),
        param([100, 100, 100, 100], 0.0, id="perfect equality"),
        param([0, 0, 0, 0], 0.0, id="all zero balance"),
        param(
            [0, 0, 0, 100], (4 - 1) / 4, id="perfect inequality"
        ),  # For N agents, the max Gini is (N-1)/N
        param([10, 20, 30, 40], 0.25, id="standard unequal distribution"),
    ],
)
def test_calculate_gini_coefficient(
    indicator_test_model_factory_balance, balances: list, expected: float
):
    """
    Tests for `calculate_gini_coefficient`. Tests against variety of balance distributions.

    Args:
        indicator_test_model_factory (_type_): a factory to create a model with specific balances easily.
        balances (list): the balances of the PersonAgents.
        expected (float): the expected Gini Coefficient calculation.
    """
    model = indicator_test_model_factory_balance(balances=balances)
    assert indicators.calculate_gini_coefficient(model) == approx(expected)


# Demographic Metrics


def test_calculate_proportion(indicator_test_model_factory_balance):
    """
    Tests for `calculate_proportion`. Tests that the proportion is correctly calculated.

    Args:
        indicator_test_model_factory_balance (_type_): a factory to create a model with specific balances easily.
    """

    model = indicator_test_model_factory_balance(balances=[1] * 100)
    proportions = indicators.calculate_proportion(model)

    expected_demographics = {
        Demographic.LOWER_CLASS: 0.0,
        Demographic.MIDDLE_CLASS: 1.0,
        Demographic.UPPER_CLASS: 0.0,
    }

    for demo in Demographic:
        assert proportions[demo] == approx(expected_demographics[demo])


def test_calculate_average_balance(indicator_test_model_factory_balance):
    """
    Tests for `calculate_average_balance`. Tests that the average balance
    is correctly calculated for each demographic.

    Args:
        indicator_test_model_factory_balance: a factory to create a model
            with specific balances easily.
    """
    # Create model with 100 agents, all middle class with balance of 50
    model = indicator_test_model_factory_balance(balances=[50] * 100)
    expected_balances = {
        Demographic.LOWER_CLASS: float("nan"),
        Demographic.MIDDLE_CLASS: 50,
        Demographic.UPPER_CLASS: float("nan"),
    }

    avg_balances = indicators.calculate_average_balance(model)

    for demo in Demographic:
        if not isnan(expected_balances[demo]):
            assert avg_balances[demo] == expected_balances[demo]
        else:
            assert isnan(avg_balances[demo])


def test_calculate_std_balance(indicator_test_model_factory_balance):
    """
    Tests for `calculate_std_balance`. Tests that the std of the balance
    is correctly calculated for each demographic.

    Args:
        indicator_test_model_factory_balance: a factory to create a model
            with specific balances easily.
    """
    # Create model with 100 agents, all middle class with balance of 50
    model = indicator_test_model_factory_balance(balances=[50] * 100)
    expected_std_balances = {
        Demographic.LOWER_CLASS: float("nan"),
        Demographic.MIDDLE_CLASS: 0,
        Demographic.UPPER_CLASS: float("nan"),
    }

    std_balances = indicators.calculate_std_balance(model)

    for demo in Demographic:
        if not isnan(expected_std_balances[demo]):
            assert std_balances[demo] == expected_std_balances[demo]
        else:
            assert isnan(std_balances[demo])


def test_calculate_average_wage(indicator_test_model_factory_income):
    """
    Tests for `calculate_average_wage`. Tests that the average income
    is correctly calculated for each demographic.

    Args:
        indicator_test_model_factory_income: a factory to create a model
            with specific incomes easily.
    """
    # Create model with 100 agents, all middle class with income of 50
    model = indicator_test_model_factory_income(incomes=[50] * 100)
    expected_wages = {
        Demographic.LOWER_CLASS: float("nan"),
        Demographic.MIDDLE_CLASS: 50,
        Demographic.UPPER_CLASS: float("nan"),
    }

    avg_wages = indicators.calculate_average_wage(model)

    for demo in Demographic:
        if not isnan(expected_wages[demo]):
            assert avg_wages[demo] == expected_wages[demo]
        else:
            assert isnan(avg_wages[demo])


def test_calculate_std_wage(indicator_test_model_factory_income):
    """
    Tests for `calculate_std_wage`. Tests that the std of the income
    is correctly calculated for each demographic.

    Args:
        indicator_test_model_factory_income: a factory to create a model
            with specific incomes easily.
    """
    # Create model with 100 agents, all middle class with incomes of 50
    model = indicator_test_model_factory_income(incomes=[50] * 100)
    expected_std_wages = {
        Demographic.LOWER_CLASS: float("nan"),
        Demographic.MIDDLE_CLASS: 0,
        Demographic.UPPER_CLASS: float("nan"),
    }

    std_wages = indicators.calculate_std_wage(model)

    for demo in Demographic:
        if not isnan(expected_std_wages[demo]):
            assert std_wages[demo] == expected_std_wages[demo]
        else:
            assert isnan(std_wages[demo])
