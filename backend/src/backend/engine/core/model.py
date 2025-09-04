from mesa import Model
from mesa.datacollection import DataCollector


from ..agents.person import PersonAgent
from ..agents.industry import IndustryAgent

from ..types.IndustryType import IndustryType


class EconomyModel(Model):

    def __init__(self, num_people=5):
        super().__init__()
        self.week = 0

        PersonAgent.create_agents(model=self, n=num_people, income=100)

        # Create one instance of each industry type
        IndustryAgent.create_agents(
            model=self,
            n=len(IndustryType),
            industry_type=list(IndustryType),
            starting_price=10.0,
        )

    def step(self):
        """Advance the simulation by one week."""
        self.week += 1

        industryAgents = self.agents_by_type[IndustryAgent]
        for industryAgent in list(industryAgents):
            industryAgent.step()
            print(
                f"Industry Type: {industryAgent.industry_type}, Starting Price: {industryAgent.starting_price}"
            )

        peopleAgents = self.agents_by_type[PersonAgent]
        for personAgent in list(peopleAgents):
            personAgent.step()
            print("Income:", personAgent.income)
