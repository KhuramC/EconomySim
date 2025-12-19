import pytest
from engine.core.model import EconomyModel
from engine.agents.person import PersonAgent
from engine.types.demographic import Demographic


@pytest.fixture()
def model(num_agents, population, industries, policies) -> EconomyModel:
    """
    A fixture that provides a valid model.

    Args:
        population (dict): a valid population.
        industries (dict): a valid industries.
        policies (dict): a valid policies.

    Returns:
        EconomyModel: a created model.
    """
    model = EconomyModel(
        max_simulation_length=52,
        num_people=num_agents,
        population=population,
        industries=industries,
        starting_policies=policies,
    )

    return model


@pytest.fixture()
def indicator_test_model_factory_balance(population, industries, policies):
    """
    A factory fixture to create a minimal EconomyModel with a specific list
    of agent balances, perfect for testing economic indicators.
    """

    def _create_model(balances: list[float]) -> EconomyModel:
        model = EconomyModel(
            max_simulation_length=1,
            num_people=len(balances),
            population=population,
            industries=industries,
            starting_policies=policies,
        )

        model.agents_by_type[PersonAgent].clear()

        for balance_val in balances:
            person = PersonAgent(
                model=model,
                demographic=Demographic.MIDDLE_CLASS,
                income=0,
                starting_balance=balance_val,
                preferences={},
            )
            model.agents_by_type[PersonAgent].add(person)

        return model

    return _create_model


@pytest.fixture()
def indicator_test_model_factory_income(population, industries, policies):
    """
    A factory fixture to create a minimal EconomyModel with a specific list
    of agent incomes, perfect for testing economic indicators.
    """

    def _create_model(incomes: list[float]) -> EconomyModel:
        model = EconomyModel(
            max_simulation_length=1,
            num_people=len(incomes),
            population=population,
            industries=industries,
            starting_policies=policies,
        )

        model.agents_by_type[PersonAgent].clear()

        for income_val in incomes:
            person = PersonAgent(
                model=model,
                demographic=Demographic.MIDDLE_CLASS,
                income=income_val,
                starting_balance=0,
                preferences={},
            )
            model.agents_by_type[PersonAgent].add(person)

        return model

    return _create_model
