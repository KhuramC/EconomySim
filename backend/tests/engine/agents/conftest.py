import pytest
from collections import defaultdict
from mesa import Model
from mesa.agent import AgentSet
from engine.agents.person import PersonAgent
from engine.agents.industry import IndustryAgent
from engine.types.industry_type import IndustryType
from engine.types.demographic import Demographic


class MockEconomyModel():
    """
    A mock EconomyModel for unit testing.
    """

    def __init__(self, starting_policies):

        self.policies = starting_policies
        self.agents_by_type = defaultdict(lambda: AgentSet([], self))
        self.market_wage = 15.0
        self.week = 0

    def get_week(self):
        return self.week
    
    def register_agent(self, agent):
        """
        Mock register_agent method that adds agents to the agents_by_type dict.
        """
        agent_type = type(agent)
        self.agents_by_type[agent_type].add(agent)
        
    def get_employees(self, industry_type):
        """
        Mock get_employees method that finds all PersonAgents employed by the given industry.
        """
        people = self.agents_by_type[PersonAgent]
        return [agent for agent in people if agent.employer == industry_type]


@pytest.fixture()
def mock_economy_model(policies) -> MockEconomyModel:
    """
    A fixture for providing a minimal MockEconomyModel.

    Args:
        policies (dict): a valid policies.

    Returns:
        MockEconomyModel: The minimal model for testing.
    """
    return MockEconomyModel(policies)
