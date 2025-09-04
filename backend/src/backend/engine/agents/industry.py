from mesa import Agent
from ..types.IndustryType import IndustryType

class IndustryAgent(Agent):
    """
    An agent representing an industry in the simulation.


    Attributes:
        industry_type (IndustryType): The type of industry this agent represents.
        starting_price (float): The initial price of goods/services in this industry.
    """
    
    industry_type: IndustryType
    """The type of industry this agent represents."""
    starting_price: float
    """The initial price of goods/services in this industry."""

    def __init__(self, model, industry_type: IndustryType, starting_price: float = 0.0):
        super().__init__(model)
        self.starting_price = starting_price
        self.industry_type = industry_type

    def step(self):
        # behavior of industry in each step
        pass
