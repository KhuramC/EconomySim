import pytest
from engine.core.model import EconomyModel
from engine.agents.person import PersonAgent
from engine.agents.industry import IndustryAgent
from engine.types.demographic import Demographic
from engine.types.industry_type import IndustryType


@pytest.fixture
def model(demographics, industries, policies) -> EconomyModel:
    """
    A fixture that provides a valid model.

    Args:
        demographics (dict): a valid demographics.
        industries (dict): a valid industries.
        policies (dict): a valid policies.

    Returns:
        EconomyModel: a created model.
    """
    model = EconomyModel(
        max_simulation_length=52,
        num_people=100,
        demographics=demographics,
        industries=industries,
        starting_policies=policies,
    )
    # TODO: test demographics properly being created

    return model


@pytest.fixture
def indicator_test_model_factory(demographics, industries, policies):
    """
    A factory fixture to create a minimal EconomyModel with a specific list
    of agent incomes, perfect for testing economic indicators.
    """

    def _create_model(balances: list[float]) -> EconomyModel:
        model = EconomyModel(
            max_simulation_length=1,
            num_people=len(balances),
            demographics=demographics,
            industries=industries,
            starting_policies=policies,
        )

        model.agents_by_type[PersonAgent].clear()

        for i, balance_val in enumerate(balances):
            person = PersonAgent(
                model=model,
                demographic=Demographic.MIDDLE_CLASS,
                income=0,
                current_money=balance_val,
                preferences={},
            )
            model.agents_by_type[PersonAgent].add(person)

        return model

    return _create_model
