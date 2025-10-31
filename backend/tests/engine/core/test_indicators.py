from pytest import mark, approx
from engine.core.model import EconomyModel
from engine.agents.person import PersonAgent
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
    assert model.calculate_unemployment() == 1.0

    # TODO: redo whenever starting unemployment logic has been updated
    peopleAgents = model.agents_by_type[PersonAgent]
    total = len(peopleAgents)
    employed = 5
    for agent in list(peopleAgents)[:employed]:
        agent.employer = IndustryType.AUTOMOBILES

    expected_unemployment = float((total - employed) / total)
    assert model.calculate_unemployment() == expected_unemployment


@mark.xfail(reason="Function not implemented yet.")
def test_calculate_gdp(model: EconomyModel):
    assert False


@mark.xfail(reason="Demographic's income feature not implemented yet.")
def test_calculate_income_per_capita(model: EconomyModel):
    # TODO: do whenever templates/demographic's distribution has been done.
    assert False


@mark.xfail(reason="Demographic's income feature not implemented yet.")
def test_calculate_median_income(model: EconomyModel):
    # TODO: do whenever templates/demographic's distribution has been done.
    assert False


@mark.xfail(reason="Function not implemented yet.")
def test_calculate_hoover_index(model: EconomyModel):
    assert False


# -- Lorenz Curve Test Suite --
def test_lorenz_curve_no_agents(indicator_test_model_factory):
    """Test Lorenz curve with zero agents should return a line of equality."""
    model = indicator_test_model_factory(balances=[])
    expected = {"x": [0, 1], "y": [0, 1]}
    assert indicators.calculate_lorenz_curve(model) == expected


def test_lorenz_curve_perfect_equality(indicator_test_model_factory):
    """Test Lorenz curve where all agents have the same balance."""
    model = indicator_test_model_factory(balances=[100, 100, 100, 100])
    result = indicators.calculate_lorenz_curve(model)

    # Curve should be a perfect linear line with slope of 1. (x always equals y)
    expected = [0.0, 0.25, 0.50, 0.75, 1.0]
    assert result["x"] == approx(expected)
    assert result["y"] == approx(expected)


def test_lorenz_curve_perfect_inequality(indicator_test_model_factory):
    """Test Lorenz curve where one agent has all the wealth."""
    model = indicator_test_model_factory(balances=[0, 0, 0, 100])
    result = indicators.calculate_lorenz_curve(model)

    # Curve should run along x-axis until the final personAgent
    expected_x = [0.0, 0.25, 0.50, 0.75, 1.0]
    expected_y = [0.0, 0.0, 0.0, 0.0, 1.0]
    assert result["x"] == approx(expected_x)
    assert result["y"] == approx(expected_y)


def test_lorenz_curve_typical_case(indicator_test_model_factory):
    """Test Lorenz curve with a standard, unequal distribution of wealth."""
    model = indicator_test_model_factory(balances=[10, 20, 30, 40])
    result = indicators.calculate_lorenz_curve(model)
    expected_x = [0.0, 0.25, 0.50, 0.75, 1.0]
    # Cumulative balance shares: [10/100, (10+20)/100, (10+20+30)/100, 100/100]
    expected_y = [0.0, 0.10, 0.30, 0.60, 1.0]
    assert result["x"] == approx(expected_x)
    assert result["y"] == approx(expected_y)


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
