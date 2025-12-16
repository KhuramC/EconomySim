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
    mock_economy_model.policies["personal_income_tax"] = [
        {"threshold": 0.0, "rate": 0.0}
    ]  # no income tax
    starting_money = 0
    person = PersonAgent(
        mock_economy_model,
        Demographic.MIDDLE_CLASS,
        preferences={},
        income=income,
        starting_balance=starting_money,
    )
    person.payday()
    assert person.balance == (starting_money + income)


@mark.parametrize(
    "personal_income_tax, expected_balance",
    [
        ([{"threshold": 0.0, "rate": 1}], 0),
        ([{"threshold": 0.0, "rate": 0.02}], 490),
        ([{"threshold": 0.0, "rate": 0.1}], 450),
        ([{"threshold": 0.0, "rate": 1 / 3}], 333.333333333),
        ([{"threshold": 0.0, "rate": 0.0}], 500),
    ],
)
def test_income_tax(
    mock_economy_model, personal_income_tax: list, expected_balance: float
):
    """
    Test for `payday` with varying levels of income tax.
    Tests that after a payday, the current money has correctly increased.

    Args:
        mock_economy_model: a mock model.
        income (int): the income of the agent.
    """
    mock_economy_model.policies["personal_income_tax"] = personal_income_tax
    starting_money = 0
    person = PersonAgent(
        mock_economy_model,
        Demographic.MIDDLE_CLASS,
        preferences={},
        income=500,
        starting_balance=starting_money,
    )
    person.payday()
    assert person.balance == approx(expected_balance)


@mark.parametrize(
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


@mark.parametrize(
    "food_sales_tax, entertainment_sales_tax, purchased_food_inventory, purchased_entertainment_inventory, total_spent",
    [
        (0.1, 0.15, 29, 20, 779),
        (1, 0.5, 16, 16, 800),
        (1 / 3, 5 / 7, 24, 14, 800),
        (0, 0, 32, 24, 800),
    ],
)
def test_purchase_goods(
    mock_economy_model,
    food_sales_tax,
    entertainment_sales_tax,
    purchased_food_inventory,
    purchased_entertainment_inventory,
    total_spent,
):
    """
    Tests the full `purchase_goods` cycle when all desired items are in stock.
    """

    # TODO: Implement testing for when desired items are NOT available (inventory too low).
    mock_economy_model.policies["sales_tax"][IndustryType.GROCERIES] = food_sales_tax
    food_industry = IndustryAgent(
        mock_economy_model,
        IndustryType.GROCERIES,
        starting_price=10,
        starting_inventory=100,
    )
    food_industry.inventory_available_this_step = food_industry.inventory

    mock_economy_model.policies["sales_tax"][
        IndustryType.ENTERTAINMENT
    ] = entertainment_sales_tax
    entertainment_industry = IndustryAgent(
        mock_economy_model,
        IndustryType.ENTERTAINMENT,
        starting_price=20,
        starting_inventory=100,
    )
    entertainment_industry.inventory_available_this_step = food_industry.inventory

    person = PersonAgent(
        mock_economy_model,
        Demographic.UPPER_CLASS,
        preferences={IndustryType.ENTERTAINMENT: 0.6, IndustryType.GROCERIES: 0.4},
        income=1000,
        savings_rate=0.2,
    )

    person.purchase_goods()

    # 1. Payday: Current money becomes 1000. Budget is 800.
    # 2. GROCERY: 800 * 0.4 = 320. Quantity: 320 / (10 * 1.1) ~= 29, actually spent 11 * 29 = 319.
    # 3. ENTERTAINMENT: 800 * 0.6 = 480. Quantity: 480 / (20*1.15) ~= 20, actually spent 23 * 21 = 460.
    # 4. Total spent: 319 + 460 = 779

    # 1. Payday: Current money becomes 1000. Budget is 800.
    # 2. GROCERY: 800 * 0.4 = 320. Quantity: 320 / (10 * 2) = 16, actually spent 20 * 16 = 320.
    # 3. ENTERTAINMENT: 800 * 0.6 = 480. Quantity: 480 / (20* 1.5) = 16, actually spent 30 * 16 = 480.
    # 4. Total spent: 320 + 480 = 800

    # 1. Payday: Current money becomes 1000. Budget is 800.
    # 2. GROCERY: 800 * 0.4 = 320. Quantity: 320 / (10 * (1 + 1/3)) = 24, actually spent ~13.33333 * 24 = 320.
    # 3. ENTERTAINMENT: 800 * 0.6 = 480. Quantity: 480 / (20 * (1 + 5/7)) = 14, actually spent ~34.2857 * 14 = 480.
    # 4. Total spent: 320 + 480 = 800

    # 1. Payday: Current money becomes 1000. Budget is 800.
    # 2. GROCERY: 800 * 0.4 = 320. Quantity: 320 / 10 = 32.
    # 3. ENTERTAINMENT: 800 * 0.6 = 480. Quantity: 480 / 20 = 24.
    # 4. Total spent: 800
    assert total_spent == approx(
        (purchased_food_inventory * (10 * (1 + food_sales_tax)))
        + (purchased_entertainment_inventory * (20 * (1 + entertainment_sales_tax)))
    )
    assert food_industry.inventory == approx(100 - purchased_food_inventory)
    assert entertainment_industry.inventory == approx(
        100 - purchased_entertainment_inventory
    )
    assert person.balance == approx(1000 - total_spent)


@mark.xfail(reason="Function not implemented yet.")
def test_change_employment():
    assert False


def test_update_class(mock_economy_model):
    """
    Unit test for personAgent.update_class().
    Tests the Pew Research Center thresholds logic.
    """
    person = PersonAgent(
        mock_economy_model,
        demographic=Demographic.MIDDLE_CLASS,  # Start as middle
        preferences={},
        income=500,
    )

    # Median = 1000
    # Low Threshold = 670, High Threshold = 2000

    # Case 1: Drop to Lower (< 670)
    person.income = 600
    person.update_class(median_income=1000)
    assert person.demographic == Demographic.LOWER_CLASS

    # Case 2: Rise to Upper (> 2000)
    person.income = 2100
    person.update_class(median_income=1000)
    assert person.demographic == Demographic.UPPER_CLASS

    # Case 3: Return to Middle (670 - 2000)
    person.income = 1000
    person.update_class(median_income=1000)
    assert person.demographic == Demographic.MIDDLE_CLASS
