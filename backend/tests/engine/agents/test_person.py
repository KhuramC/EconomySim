from pytest import mark, approx
from engine.agents.person import PersonAgent
from engine.types.demographic import Demographic, DEMOGRAPHIC_SIGMAS
from engine.types.industry_type import IndustryType
from engine.agents.industry import IndustryAgent


def test_agent_initialization(mock_economy_model):
    """
    Tests that the __init__ method correctly sets agent attributes
    Args:
        mock_economy_model: a mock model
    """
    person = PersonAgent(
        mock_economy_model,
        demographic=Demographic.MIDDLE_CLASS,
        preferences={IndustryType.GROCERIES: 1.0},
    )

    assert person.demographic == Demographic.MIDDLE_CLASS
    assert person.savings_rate == 0.10
    assert person.sigma == DEMOGRAPHIC_SIGMAS[Demographic.MIDDLE_CLASS]


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
        preferences={},
        income=income,
        current_money=starting_money,
    )
    person.payday()
    assert person.current_money == (starting_money + income)


@mark.parametize(
    "income, savings_rate, expected_budget",
    [(1000, 0.1, 900), (500, 0.25, 375), (2000, 0.0, 2000), (100, 1.0, 0)],
)
def test_determine_budget(mock_economy_model, income, savings_rate, expected_budget):
    """
    Tests the `determine_budget` function with various incomes and savings rates.

    Args:
        mock_economy_model: a mock model
        income (int): the income of the agent.
        savings_rate (float): percent of income that the agent will choose not to purchase goods with
        expected_budget: expected correct answer of determine_budget
    """
    person = PersonAgent(
        mock_economy_model,
        Demographic.MIDDLE_CLASS,
        preferences={},
        income=income,
        savings_rate=savings_rate,
    )

    budget = person.determine_budget()
    assert budget == expected_budget


def test_demand_func(mock_economy_model):
    """
    Tests the `demand_func` with sigma=1, which simplifies to the Cobb-Douglas case.
    In this case, an agent spends a percentage of their budget on a good
    equal to their preference weight for it.

    Args:
        mock_economy_model: a mock model
    """

    person = PersonAgent(
        mock_economy_model,
        demographic=Demographic.UPPER_CLASS,
        preferences={IndustryType.ENTERTAINMENT: 0.6, IndustryType.GROCERIES: 0.4},
    )

    prices = {IndustryType.ENTERTAINMENT: 10.0, IndustryType.GROCERIES: 25.0}
    budget = 1000.0

    demands = person.demand_func(budget, person.preferences, prices)

    # Expected food: (1000 * 0.6) / 10 = 60 units
    # Expected clothing: (1000 * 0.4) / 25 = 16 units
    assert demands[IndustryType.ENTERTAINMENT] == approx(60.0)
    assert demands[IndustryType.GROCERIES] == approx(16.0)


def test_purchase_goods(mock_economy_model):
    """
    Tests the full `purchase_goods` cycle when all desired items are in stock.
    """

    # TODO: Implement testing for when desired items are NOT available (inventory too low).

    food_industry = IndustryAgent(
        mock_economy_model,
        IndustryType.GROCERIES,
        starting_price=10,
        starting_inventory=100,
    )
    entertainment_industry = IndustryAgent(
        mock_economy_model,
        IndustryType.ENTERTAINMENT,
        starting_price=20,
        starting_inventory=100,
    )

    person = PersonAgent(
        mock_economy_model,
        Demographic.UPPER_CLASS,
        preferences={IndustryType.ENTERTAINMENT: 0.6, IndustryType.GROCERIES: 0.4},
        income=1000,
        savings_rate=0.2,
    )

    person.purchase_goods()

    # 1. Payday: Current money becomes 1000. Budget is 800.
    # 2. GROCERY: 800 * 0.4 = 320. Quantity: 320 / 10 = 32.
    # 3. ENTERTAINMENT: 800 * 0.6 = 480. Quantity: 480 / 20 = 24.
    # 4. Total spent: 800
    assert food_industry.inventory == 100 - 32
    assert entertainment_industry.inventory == 100 - 24
    assert person.current_money == approx(200)


@mark.xfail(reason="Function not implemented yet.")
def test_purchase_goods():
    assert False


@mark.xfail(reason="Function not implemented yet.")
def test_change_employment():
    assert False
