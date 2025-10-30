import pytest
from engine.core.model import EconomyModel
from engine.agents.person import PersonAgent
from engine.agents.industry import IndustryAgent
from engine.types.demographic import Demographic
from engine.types.industry_type import IndustryType


@pytest.fixture
def default_demographics():
    """Provides a default, valid demographics dictionary for the model."""
    return {
        Demographic.LOWER_CLASS: {
            "proportion": 0.33,
            "income": {"mean": 30000, "sd": 5000},
            "current_money": {"mean": 500, "sd": 100},
            "unemployment_rate": 0.1,
            "spending_behavior": {
                itype: 1 / len(IndustryType) for itype in IndustryType
            },
        },
        Demographic.MIDDLE_CLASS: {
            "proportion": 0.34,
            "income": {"mean": 50000, "sd": 5000},
            "current_money": {"mean": 500, "sd": 100},
            "unemployment_rate": 0.1,
            "spending_behavior": {
                itype: 1 / len(IndustryType) for itype in IndustryType
            },
        },
        Demographic.UPPER_CLASS: {
            "proportion": 0.33,
            "income": {"mean": 100000, "sd": 5000},
            "current_money": {"mean": 500, "sd": 100},
            "unemployment_rate": 0.1,
            "spending_behavior": {
                itype: 1 / len(IndustryType) for itype in IndustryType
            },
        },
    }


@pytest.fixture
def default_industries():
    """Provides a default, valid industries dictionary."""
    industries = {}
    for ind in IndustryType:
        industries[ind] = {
            "price": 10,
            "inventory": 1000,
            "money": 50000,
            "offered_wage": 15,
        }

    return industries


@pytest.fixture
def default_policies():
    """Provides a default, valid policies dictionary."""
    return {
        "corporate_income_tax": {itype: 0.2 for itype in IndustryType},
        "personal_income_tax": {demo: 0.15 for demo in Demographic},
        "sales_tax": {itype: 0.05 for itype in IndustryType},
        "property_tax": 0.015,
        "tariffs": {itype: 0.03 for itype in IndustryType},
        "subsidies": {itype: 0 for itype in IndustryType},
        "rent_cap": 2000,
        "minimum_wage": 12,
    }


@pytest.fixture
def model(default_demographics, default_industries, default_policies) -> EconomyModel:
    """
    A fixture that provides a valid model.

    Args:
        default_demographics (dict): a valid demographics.
        default_industries (dict): a valid industries.
        default_policies (dict): a valid policies.

    Returns:
        EconomyModel: a created model.
    """
    model = EconomyModel(
        max_simulation_length=52,
        num_people=100,
        demographics=default_demographics,
        industries=default_industries,
        starting_policies=default_policies,
    )
    # TODO: test demographics properly being created

    return model


@pytest.fixture
def indicator_test_model_factory(default_policies):
    """
    A factory fixture to create a minimal EconomyModel with a specific list
    of agent incomes, perfect for testing economic indicators.
    """
    
    def _create_model(incomes: list[float]) -> EconomyModel:
        model = EconomyModel(
            max_simulation_length=1,
            num_people=len(incomes),
            demographics={demo: {"proportion": 0} for demo in Demographic},
            industries={},
            starting_policies=default_policies
        )
        
        model.agents_by_type[PersonAgent].clear()
        
        for i, income_val in enumerate(incomes):
            person = PersonAgent(
                model=model,
                demographic=Demographic.MIDDLE_CLASS,
                income=income_val,
                current_money=0,
                preferences={}
            )
            model.agents_by_type[PersonAgent].add(person)
            
        return model
    return _create_model