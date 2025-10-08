from mesa import Agent
from mesa import Model
from ..types.industry_type import IndustryType
import logging


class IndustryAgent(Agent):
    """
    An agent representing an industry in the simulation.

    Attributes:
        industry_type (IndustryType): The type of industry this agent represents.
        price (float): The price of goods/services in this industry.
        inventory (int): The inventory level of goods/services in this industry.
        total_money (float): The total money held by this industry. Negative indicates debt.
        offered_wage (float): The per time step(weekly) wage offered by this industry.
    """

    industry_type: IndustryType
    """The type of industry this agent represents."""
    price: float
    """The price of goods/services in this industry."""
    inventory: int
    """The inventory level of goods/services in this industry."""
    total_money: float
    """The total money held by this industry. Negative indicates debt."""
    offered_wage: float
    """The weekly wage offered by this industry."""

    def __init__(
        self,
        model: Model,
        industry_type: IndustryType,
        starting_price: float = 0.0,
        starting_inventory: int = 0,
        starting_money: float = 0.0,
        starting_offered_wage: float = 0.0,
    ):
        """
        Initialize an IndustryAgent with its starting values.
        """
        super().__init__(model)
        self.price = starting_price
        self.industry_type = industry_type
        self.inventory = starting_inventory
        self.total_money = starting_money
        self.offered_wage = starting_offered_wage

    def get_tariffs(self) -> float:
        """
        Get the tariff rate for this industry from the model's tax rates.

        Returns:
            float: The tariff rate for this industry.
        """
        tariffs = self.model.policies.get("tariffs", {})
        return tariffs.get(self.industry_type, 0.0)

    def get_employees(self):
        """
        Gets all employees that are employed to this industry.
        """
        return self.model.get_employees(self.industry_type)

    def determine_price(self):
        """
        Determine the price of goods/services in this industry based on market conditions.
        """
        logging.info("Determining price...NOT IMPLEMENTED")
        # TODO: implement industry pricing logic
        self.price = self.price + 1  # placeholder logic
        logging.info(f"Tariff rate is {self.get_tariffs()}")
        pass

    def produce_goods(self):
        """
        How the industry will determine how many goods to produce.
        """
        logging.info("Producing goods...NOT IMPLEMENTED")
        # TODO: Implement industry goods production
        self.inventory = self.inventory + 15  # placeholder logic
        pass

    def change_employment(self):
        """
        How the industry will change their employees, whether it be by hiring more, firing more,
        or changing the wages.
        """
        logging.info("Changing employment...NOT IMPLEMENTED")
        # TODO: Implement industry employment logic
        # deals with potentially firing or hiring employees, and wage changes
        # should call determine_wages at some point
        pass

    def determine_wages(self):
        """
        How the industry will determine what to set their hiring wages at.
        """
        logging.info("Changing wages...NOT IMPLEMENTED")

        # TODO: Implement industry wage logic

        pass
