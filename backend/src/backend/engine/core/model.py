from mesa import Model
from mesa.datacollection import DataCollector

from ..agents.person import PersonAgent
from ..agents.industry import IndustryAgent


class EconomyModel(Model):

    def __init__(self, num_people=5, num_industries=2):
        super().__init__()
        self.week = 0
        self.people = []
        self.industries = []

        # Create people
        for i in range(num_people):
            person = PersonAgent(model=self, income=100)
            self.people.append(person)

        # Create industries
        for j in range(num_industries):
            industry = IndustryAgent(model=self, starting_price=10.0)
            self.industries.append(industry)

    def step(self):
        """Advance the simulation by one week."""
        self.week += 1
        for agent in list(self.industries):
            agent.step()
        for agent in list(self.people):
            agent.step()
