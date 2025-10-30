from pytest import mark, approx
from engine.core.model import EconomyModel
from engine.agents.person import PersonAgent
from engine.types.industry_type import IndustryType


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
    model = indicator_test_model_factory(incomes=[])
    expected = {"x": [0, 1], "y": [0, 1]}
    assert model.calculate_lorenz_curve() == expected


def test_lorenz_curve_perfect_equality(indicator_test_model_factory):
    """Test Lorenz curve where all agents have the same income."""
    model = indicator_test_model_factory(incomes=[100, 100, 100, 100])
    result = model.calculate_lorenz_curve()

    # Curve should be a perfect linear line with slope of 1. (x always equals y)
    expected = [0.0, 0.25, 0.50, 0.75, 1.0]
    assert result["x"] == approx(expected)
    assert result["y"] == approx(expected)


def test_lorenz_curve_perfect_inequality(indicator_test_model_factory):
    """Test Lorenz curve where one agent has all the income."""
    model = indicator_test_model_factory(incomes=[0, 0, 0, 100])
    result = model.calculate_lorenz_curve()
    
    # Curve should run along x-axis until the final personAgent
    expected_x = [0.0, 0.25, 0.50, 0.75, 1.0]
    expected_y = [0.0, 0.0, 0.0, 0.0, 1.0]
    assert result["x"] == approx(expected_x)
    assert result["y"] == approx(expected_y)


def test_lorenz_curve_typical_case(indicator_test_model_factory):
    """Test Lorenz curve with a standard, unequal distribution of income."""
    model = indicator_test_model_factory(incomes=[10, 20, 30, 40])
    result = model.calculate_lorenz_curve()
    expected_x = [0.0, 0.25, 0.50, 0.75, 1.0]
    # Cumulative income shares: [10/100, (10+20)/100, (10+20+30)/100, 100/100]
    expected_y = [0.0, 0.10, 0.30, 0.60, 1.0]
    assert result['x'] == approx(expected_x)
    assert result['y'] == approx(expected_y)