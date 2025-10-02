import pytest
from pytest import mark
from backend.engine.agents.industry import IndustryAgent
from backend.engine.types.IndustryType import IndustryType


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
