from mesa import Model
import pytest


class MockEconomyModel(Model):
    """
    A mock EconomyModel for unit testing.
    """

    def __init__(self, starting_policies):
        super().__init__()
        self.policies = starting_policies


@pytest.fixture()
def mock_economy_model(policies) -> MockEconomyModel:
    """
    A fixture for providing a MockEconomyModel.

    Args:
        policies (dict): a valid policies.

    Returns:
        mock_moedle (MockEconomyModel): the model with the desired seting.
    """
    return MockEconomyModel(policies)
