import pytest
from engine.types.industry_type import IndustryType
from engine.types.demographic import Demographic

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
        "current_money": {
            # Starting cash on hand, increases with class
            "mean": 500 + (i * 2500),
            "sd": 200 + (i * 1000),
        },
    }
    for i, demo in enumerate(Demographic)
}
"""A sample demographics variable that should pass a validate_schema call by an EconomyModel."""

POLICIES = {
    "corporate_income_tax": {itype.value: i for i, itype in enumerate(IndustryType)},
    "personal_income_tax": 2.0,
    "sales_tax": {itype.value: i ^ 2 for i, itype in enumerate(IndustryType)},
    "property_tax": 4.0,
    "tariffs": {itype.value: i * 2.5 for i, itype in enumerate(IndustryType)},
    "subsidies": {itype.value: i * -2 for i, itype in enumerate(IndustryType)},
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
def policies() -> dict[str, float | dict[IndustryType, float]]:
    """
    A fixture that provides a valid set of policies for starting a simulation.
    """
    return POLICIES
