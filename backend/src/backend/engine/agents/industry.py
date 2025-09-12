from mesa import Agent
from mesa import Model
from ..types.IndustryType import IndustryType
import logging


class IndustryAgent(Agent):
    """
    An agent representing an industry in the simulation.

    Attributes:
        industry_type (IndustryType): The type of industry this agent represents.
        starting_price (float): The initial price of goods/services in this industry.
    """

    industry_type: IndustryType
    """The type of industry this agent represents."""
    price: float
    """The price of goods/services in this industry."""

    def __init__(
        self, model: Model, industry_type: IndustryType, starting_price: float = 0.0
    ):
        super().__init__(model)
        self.price = starting_price
        self.industry_type = industry_type

    def determine_price(self):
        logging.info("Determining price...NOT IMPLEMENTED")
        # profit maximization from /logic should be called here
        self.price = self.price + 1
        pass

    def change_employment(self):
        logging.info("Changing employment...NOT IMPLEMENTED")
        # employment change from /logic should be called here
        # deals with potentially firing or hiring employees, and wage changes
        pass
