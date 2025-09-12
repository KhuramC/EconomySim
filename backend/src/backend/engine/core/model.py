from mesa import Model
from mesa.datacollection import DataCollector


from ..agents.person import PersonAgent
from ..agents.industry import IndustryAgent

from ..types.IndustryType import IndustryType


class EconomyModel(Model):

    def __init__(self, num_people: int):
        super().__init__()
        self.week = 0

        self.datacollector = DataCollector(
            model_reporters={
                "Week": self.week,
                "Unemployment": self.calculate_unemployment,
                "GDP": self.calculate_gdp,
                "IncomePerCapita": self.calculate_income_per_capita,
                "MedianIncome": self.calculate_median_income,
                "HooverIndex": self.calculate_hoover_index,
                "LorenzCurve": self.calculate_lorenz_curve,
            },
            agenttype_reporters={IndustryAgent: {"Price": "price"}},
        )
        # will need to create with income based on demographics later
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

        self.datacollector.collect(self)

        # industry agents do their tasks
        industryAgents = self.agents_by_type[IndustryAgent]
        industryAgents.shuffle_do("determine_price")
        industryAgents.shuffle_do("change_employment")

        # people agents do their tasks
        peopleAgents = self.agents_by_type[PersonAgent]
        peopleAgents.shuffle_do("purchase")
        peopleAgents.shuffle_do("change_employment")

    # Economic indicators

    def calculate_unemployment(self):
        return 1

    def calculate_gdp(self):
        return 2

    def calculate_income_per_capita(self):
        return 3

    def calculate_median_income(self):
        return 4

    def calculate_hoover_index(self):
        return 5

    def calculate_lorenz_curve(self):
        return 6
