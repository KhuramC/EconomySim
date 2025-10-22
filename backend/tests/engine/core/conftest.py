import pytest
from engine.core.model import EconomyModel


@pytest.fixture()
def model(demographics, policies) -> EconomyModel:
    """
    A fixture that provides a valid model.

    Args:
        demographics (dict): a valid demographics.
        policies (dict): a valid policies.

    Returns:
        EconomyModel: a created model.
    """
    model = EconomyModel(
        max_simulation_length=52, num_people=100, demographics=demographics, starting_policies=policies
    )
    # TODO: test demographics properly being created

    return model
