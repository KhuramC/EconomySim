import pytest
from mesa import Model
from mesa.agent import AgentSet
from engine.core.model import EconomyModel
from engine.types.industry_type import IndustryType
from engine.types.demographic import Demographic
from engine.agents.person import PersonAgent
from engine.agents.industry import IndustryAgent

DEMOGRAPHICS = {
    demo: {
        "income": {
            # Weekly income, increases with class
            "mean": 300 + (i * 500),
            "sd": 100 + (i * 150),
        },
        # Proportions that roughly add up to 1.0
        "proportion": [0.45, 0.40, 0.15][i],
        # Unemployment rate, decreases with class
        "unemployment_rate": 0.08 - (i * 0.02),
        "spending_behavior": {
            itype.value: 1 / len(list(IndustryType)) for itype in IndustryType
        },
        "balance": {
            # Starting cash on hand, increases with class
            "mean": 500 + (i * 2500),
            "sd": 200 + (i * 1000),
        },
    }
    for i, demo in enumerate(Demographic)
}
"""A sample demographics variable that should pass a validate_schema call by an EconomyModel."""

INDUSTRIES = {
    itype: {
        "price": 10.0 + i * 5.0,
        "inventory": 1000 + i * 500,
        "balance": 50000 + i * 10000,
        "offered_wage": 15.0 + i * 2.5,
    }
    for i, itype in enumerate(IndustryType)
}
"""A sample industries variable that should pass a validate_schema call by an EconomyModel."""

POLICIES = {
    "corporate_income_tax": {itype.value: i for i, itype in enumerate(IndustryType)},
    "personal_income_tax": {demo.value: i * 2 for i, demo in enumerate(Demographic)},
    "sales_tax": {itype.value: i ^ 2 for i, itype in enumerate(IndustryType)},
    "property_tax": 4.0,
    "tariffs": {itype.value: i * 2.5 for i, itype in enumerate(IndustryType)},
    "subsidies": {itype.value: i * -2 for i, itype in enumerate(IndustryType)},
    "rent_cap": 0.0,
    "minimum_wage": 7.25,
}
"""A sample policies variable that should pass a validate_schema call by an EconomyModel."""


@pytest.fixture()
def demographics() -> (
    dict[Demographic, dict[str, float | dict[str | IndustryType, float]]]
):
    """
    A fixture that provides a valid demographics for starting a simulation.
    """
    return DEMOGRAPHICS


@pytest.fixture()
def industries() -> dict[IndustryType, dict[str, float | int]]:
    """
    A fixture that provides a valid set of industries for starting a simulation.
    """
    return INDUSTRIES


@pytest.fixture()
def policies() -> dict[str, float | dict[IndustryType, float]]:
    """
    A fixture that provides a valid set of policies for starting a simulation.
    """
    return POLICIES
