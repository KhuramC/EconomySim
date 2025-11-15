from mesa import Model
from mesa.agent import AgentSet
from engine.agents.person import PersonAgent
from engine.types.industry_type import IndustryType
from engine.types.demographic import Demographic
import pytest


class MockEconomyModel(Model):
    """
    A mock EconomyModel for unit testing.
    """

    def __init__(self, starting_policies):
        super().__init__()
        self.policies = starting_policies

        self.MOCK_EMPLOYEES = {
            industry_type: AgentSet(
                [
                    PersonAgent(
                        self,
                        demographic=Demographic.LOWER_CLASS,
                        preferences={i_type: 1.0 * i for i_type in IndustryType},
                    )
                ],
                self
            )
            for i, industry_type in enumerate(IndustryType)
        }
        """A mock dictionary associating employees with industry types."""

    def get_employees(self, industry_type: IndustryType) -> AgentSet:
        return self.MOCK_EMPLOYEES[industry_type]


@pytest.fixture()
def mock_economy_model(policies) -> MockEconomyModel:
    """
    A fixture for providing a MockEconomyModel.

    Args:
        policies (dict): a valid policies.

    Returns:
        mock_model (MockEconomyModel): an instance of the mock model.
    """
    return MockEconomyModel(policies)
