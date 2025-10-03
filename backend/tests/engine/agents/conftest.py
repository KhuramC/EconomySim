from mesa import Model
import pytest
from engine.types.industry_type import IndustryType


class MockEconomyModel(Model):
    """
    A mock EconomyModel for unit testing.
    """

    def __init__(self, starting_policies):
        super().__init__()
        self.policies = starting_policies

@pytest.fixture
def mock_economy_model(policies):
    return MockEconomyModel(policies)
