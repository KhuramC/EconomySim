import pytest
import logging
from typing import Any
from engine.types.industry_type import IndustryType
from engine.types.demographic import Demographic

NUM_AGENTS = 10

POPULATION = {
    "income_mean": 800,
    "income_std": 250,
    "balance_mean": 3000,
    "balance_std": 1200,
    "spending_behaviors": {
        demo: {itype.value: 1 / len(list(IndustryType)) for itype in IndustryType}
        for demo in Demographic
    },
}
"""A sample population variable that should pass a validate_schema call by an EconomyModel."""

INDUSTRIES = {
    itype: {
        "starting_price": 10.0 + i * 5.0,
        "starting_inventory": 1000 + i * 500,
        "starting_balance": 50000 + i * 10000,
        "starting_offered_wage": 15.0 + i * 2.5,
        "starting_fixed_cost": 7692.00,
        "starting_raw_mat_cost": 42.48,
        "starting_number_of_employees": 1903,
        "starting_worker_efficiency": 1.655,
        "starting_debt_allowed": True,
        "starting_demand_intercept": 166.59,
        "starting_demand_slope": 0.000826,
    }
    for i, itype in enumerate(IndustryType)
}
"""A sample industries variable that should pass a validate_schema call by an EconomyModel."""

POLICIES = {
    "corporate_income_tax": {itype.value: i for i, itype in enumerate(IndustryType)},
    "personal_income_tax": [{"threshold": 0.0, "rate": 0.0}],
    "sales_tax": {itype.value: i * 0.00 for i, itype in enumerate(IndustryType)},
    "property_tax": {"residential": 0.0, "commercial": 0.0},
    "tariffs": {itype.value: i * 0.0 for i, itype in enumerate(IndustryType)},
    "subsidies": {itype.value: i * 0.0 for i, itype in enumerate(IndustryType)},
    "price_cap": {itype.value: None for itype in IndustryType},
    "price_cap_enabled": {itype.value: False for itype in IndustryType},
    "minimum_wage": 7.25,
}
"""A sample policies variable that should pass a validate_schema call by an EconomyModel."""


@pytest.fixture()
def num_agents() -> int:
    """
    A fixture that provides the number of agents in a simulation.
    """
    return NUM_AGENTS


@pytest.fixture()
def population() -> (
    dict[str, int | float | dict[str, float] | dict[str, dict[IndustryType, float]]]
):
    """
    A fixture that provides a valid population for starting a simulation.
    """
    return POPULATION


@pytest.fixture()
def industries() -> dict[IndustryType, dict[str, Any]]:
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


@pytest.fixture(autouse=True)
def quiet_logging():
    logging.disable(logging.CRITICAL)
    yield
    logging.disable(logging.NOTSET)
