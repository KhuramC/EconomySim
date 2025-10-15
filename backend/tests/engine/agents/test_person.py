from pytest import mark
from engine.agents.person import PersonAgent
from engine.types.demographic import Demographic


@mark.parametrize("income", [0, 1, 5, 32])
def test_payday(mock_economy_model, income: int):
    """
    Test for `payday`.
    Tests that after a payday, the current money has correctly increased.

    Args:
        mock_economy_model: a mock model
        income (int): the income of the agent.
    """
    starting_money = 0
    person = PersonAgent(
        mock_economy_model,
        Demographic.MIDDLE_CLASS,
        income=income,
        current_money=starting_money,
    )
    person.payday()
    assert person.current_money == (starting_money + income)


@mark.xfail(reason="Function not implemented yet.")
def test_purchase_goods():
    assert False


@mark.xfail(reason="Function not implemented yet.")
def test_change_employment():
    assert False
