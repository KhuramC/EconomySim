from pytest import mark
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


@mark.xfail(reason="Function not implemented yet.")
def test_calculate_lorenz_curve(model: EconomyModel):
    
    assert False
