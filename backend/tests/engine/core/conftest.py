import pytest
from engine.core.model import EconomyModel


@pytest.fixture
def model(demographics, policies):
    model = EconomyModel(
        num_people=100, demographics=demographics, starting_policies=policies
    )
    # TODO: test demographics properly being created

    return model
