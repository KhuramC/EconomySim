from pytest import mark
from backend.engine.agents.person import PersonAgent
from backend.engine.types.IndustryType import IndustryType


def test_get_week(model):
    assert model.get_week() == 0
    model.step()
    assert model.get_week() == 1


def test_calculate_unemployment(model):
    assert model.calculate_unemployment() == 1.0
    # TODO: redo whenever templates for whenever starting unemployment logic has been updated
    peopleAgents = model.agents_by_type[PersonAgent]
    total = len(peopleAgents)
    employed = 5
    for agent in list(peopleAgents)[:employed]:
        agent.employer = IndustryType.AUTOMOBILES

    expected_unemployment = float((total - employed) / total)
    assert model.calculate_unemployment() == expected_unemployment


@mark.xfail(reason="Function not implemented yet.")
def test_calculate_gdp():
    assert False


@mark.xfail(reason="Demographic's Income feature not implemented yet.")
def test_calculate_income_per_capita(model):
    # TODO: do whenever templates for demographic's distribution has been done.
    assert False


@mark.xfail(reason="Demographic's Income feature  not implemented yet.")
def test_calculate_median_income(model):
    # TODO: do whenever templates for demographic's distribution has been done.
    assert False


@mark.xfail(reason="Function not implemented yet.")
def test_calculate_hoover_index():
    assert False


@mark.xfail(reason="Function not implemented yet.")
def test_calculate_lorenz_curve():
    assert False
