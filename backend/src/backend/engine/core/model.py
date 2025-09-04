from mesa import Model
from mesa.datacollection import DataCollector

from ..agents.person import PersonAgent
from ..agents.industry import IndustryAgent

from ..types.IndustryType import IndustryType


class EconomyModel(Model):

    def __init__(self, num_people=5):
        super().__init__()
        self.week = 0
        self.people = []
        self.industries = []

        # Create people
        for i in range(num_people):
            person = PersonAgent(model=self, income=100)
            self.people.append(person)

        # Create one instance of each industry type
        for industryType in IndustryType:
            industry = IndustryAgent(
                model=self, industry_type=industryType, starting_price=10.0
            )
            self.industries.append(industry)

    def step(self):
        """Advance the simulation by one week."""
        self.week += 1
        for agent in list(self.industries):
            agent.step()
        for agent in list(self.people):
            agent.step()
