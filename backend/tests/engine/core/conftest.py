import pytest
from engine.core.model import EconomyModel


@pytest.fixture
def model(policies):
    model = EconomyModel(num_people=100, starting_policies=policies)
    # TODO: test demographics properly being created

    return model
