import pytest
from pytest import mark
from engine.agents.industry import IndustryAgent
from engine.types.industry_type import IndustryType


@pytest.mark.parametrize("industry_type", list(IndustryType))
def test_get_tariffs(mock_economy_model, industry_type: IndustryType):
    """
    Test for `get_tariffs`.
    Tests that the tariffs obtained for this industry is accurate.

    Args:
        industry_type (IndustryType): the industry be looked at.
        mock_economy_model: a mock model. 
    """

    i_agent = IndustryAgent(mock_economy_model, industry_type=industry_type)
    assert (
        i_agent.get_tariffs() == mock_economy_model.policies["tariffs"][industry_type]
    )


@mark.xfail(reason="TODO.")
def test_get_employees():
    assert False


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
