from mesa import Agent
from ..types.IndustryType import IndustryType

class IndustryAgent(Agent):

    def __init__(self, model, industry_type: IndustryType, starting_price: float = 0.0):
        super().__init__(model)
        self.starting_price = starting_price
        self.industry_type = industry_type

    def step(self):
        # behavior of industry in each step
        pass
