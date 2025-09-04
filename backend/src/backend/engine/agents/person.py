from mesa import Agent, Model
from .industry import IndustryAgent
import logging


class PersonAgent(Agent):
    """
    An agent representing a person in the simulation.

    Attributes:
        income (int): The weekly income of the person.
        employer (IndustryAgent | None): The industry agent that employs this person, or None if unemployed.
        current_money (int): The current amount of money the person has; negative indicating debt.
    """

    income: int
    """weekly because of timestep"""
    employer: IndustryAgent | None
    """could be None if unemployed"""
    current_money: int
    """negative means debt"""

    def __init__(
        self,
        model: Model,
        income: int = 0,
        employer: IndustryAgent | None = None,
        current_money: int = 0,
    ):
        super().__init__(model)
        self.income = income
        self.employer = employer
        self.current_money = current_money

    def purchase(self):
        logging.debug("Purchasing...NOT IMPLEMENTED")
        # utility maximization from /logic should be called here
        pass

    def change_employment(self):
        logging.debug("Changing employment...NOT IMPLEMENTED")
        if self.employer is not None:
            logging.debug("Already employed, no action taken.")
            return
        # employment change from /logic should be called here
        # deals with trying to find a new job if unemployed
        pass
