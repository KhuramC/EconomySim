import statistics
import random
from mesa import Model
from mesa.agent import AgentSet
from mesa.datacollection import DataCollector

from ..agents.person import PersonAgent
from ..agents.industry import IndustryAgent
from ..types.industry_type import IndustryType
from ..types.demographic import Demographic

demographics_schema = {
    demo.value: {
        "income": {"mean": None, "sd": None},
        "proportion": None,
        "unemployment_rate": None,
        "spending_behavior": {itype.value: None for itype in IndustryType},
        "current_money": {"mean": None, "sd": None},
    }
    for demo in Demographic
}
"""Schema for validating the demographics dictionary."""

policies_schema = {
    "corporate_income_tax": {itype.value: None for itype in IndustryType},
    "personal_income_tax": None,
    "sales_tax": {itype.value: None for itype in IndustryType},
    "property_tax": None,
    "tariffs": {itype.value: None for itype in IndustryType},
    "subsidies": {itype.value: None for itype in IndustryType},
    "minimum_wage": None,
}
"""Schema for validating the policies dictionary."""


class EconomyModel(Model):
    """
    The main model for the economic simulation.

    Attributes:
        week (int): The current week in the simulation.
        policies (dict): A dictionary of various tax rates in the simulation.
        minimum_wage (float): The minimum wage an industry can offer their employees.
        inflation_rate (float): The weekly inflation rate in the simulation.
        random_events (bool): Whether random events are enabled in the simulation.
    """

    week: int
    """The current week in the simulation."""

    # Changeable by the user at any time

    policies: dict[str, float | dict[IndustryType, float]]
    """A dictionary of the various policies available to change in the simulation. Needs to match policies_schema."""

    # Set at the start of the simulation

    inflation_rate: float
    """The weekly inflation rate in the simulation."""

    random_events: bool
    """Whether random events are enabled in the simulation."""

    def __init__(
        self,
        num_people: int,
        demographics: dict[
            Demographic, dict[str, float | dict[str | IndustryType, float]]
        ],
        starting_policies: dict[str, float | dict[IndustryType, float]],
        inflation_rate: float = 0.000001,
        random_events: bool = False,
    ):
        super().__init__()
        self.week = 0

        # check demographics/policies has all necessary keys
        self.validate_schema(demographics, demographics_schema, path="demographics")
        self.validate_schema(starting_policies)

        self.policies = starting_policies

        self.inflation_rate = inflation_rate
        self.random_events = random_events

        self.datacollector = DataCollector(
            model_reporters={
                "Week": self.get_week,
                "Unemployment": self.calculate_unemployment,
                "GDP": self.calculate_gdp,
                "IncomePerCapita": self.calculate_income_per_capita,
                "MedianIncome": self.calculate_median_income,
                "HooverIndex": self.calculate_hoover_index,
                "LorenzCurve": self.calculate_lorenz_curve,
            },
            agenttype_reporters={IndustryAgent: {"Price": "price"}},
        )

        self.setup_person_agents(num_people, demographics)

        # Create one instance of each industry type
        IndustryAgent.create_agents(
            model=self,
            n=len(IndustryType),
            industry_type=list(IndustryType),
            starting_price=10.0,
        )

        # collect info for first week
        self.datacollector.collect(self)

    def validate_schema(
        self, data: dict, schema: dict = policies_schema, path="policies"
    ):
        """
        Recursively validate the dictionary against the schema.

        Args:
            data (dict): The dictionary to validate.
            path (str, optional): Name of dict variable. Defaults to "policies".

        Raises:
            ValueError: If the data dictionary does not match the schema.
        """

        missing = set(schema.keys()) - set(data.keys())
        if missing:
            raise ValueError(f"Missing keys at {path}: {missing}")

        for key, subschema in schema.items():
            if isinstance(subschema, dict):
                self.validate_schema(data[key], subschema, path=f"{path}[{key}]")

    def setup_person_agents(
        self,
        num_people: int,
        demographics: dict[
            Demographic, dict[str, float | dict[str | IndustryType, float]]
        ],
    ):
        # TODO: need to create with income based on demographics
        incomes = [random.uniform(0, 100) for _ in range(num_people)]
        PersonAgent.create_agents(
            model=self,
            n=num_people,
            demographic=Demographic.MIDDLE_CLASS,
            income=incomes,
        )

        # TODO: set unemployment based on starting_unemployment_rate per demographic

    def get_employees(self, industry: IndustryType) -> AgentSet:
        """
        Gets all employees that are employed to the specified industry.

        Args:
            industry (IndustryType): The industry type to filter employees by.

        Returns:
            AgentSet: An AgentSet of PersonAgents employed in the specified industry.
        """
        peopleAgents = self.agents_by_type[PersonAgent]
        return peopleAgents.select(
            lambda agent: (
                agent.employer is not None and agent.employer.industry_type == industry
            )
        )

    def inflation(self):
        # TODO: implement inflation logic.
        # could have prices go up by inflation percentage and current_money go down by the same percentage
        pass

    def step(self):
        """
        Advance the simulation by one week.
        """
        self.week += 1  # new week

        # TODO: implement inflation logic
        self.inflation()

        # industry agents do their tasks
        industryAgents = self.agents_by_type[IndustryAgent]
        industryAgents.shuffle_do("determine_price")
        industryAgents.shuffle_do("produce_goods")
        industryAgents.shuffle_do("change_employment")

        # people agents do their tasks
        peopleAgents = self.agents_by_type[PersonAgent]
        peopleAgents.shuffle_do("purchase_goods")
        peopleAgents.shuffle_do("change_employment")

        # collect info for this week
        self.datacollector.collect(self)

    # Economic indicators

    def get_week(self) -> int:
        """
        Get the current week of the simulation.

        Returns:
            week(int): The current week.
        """
        return self.week

    def calculate_unemployment(self) -> float:
        """
        Calculates the unemployment rate at the current step.

        Returns:
            percentage(float): The percentage of unemployed people in the simulation.
        """
        peopleAgents = self.agents_by_type[PersonAgent]
        unemployed = len(peopleAgents.select(lambda agent: (agent.employer is None)))
        total = len(peopleAgents)

        return unemployed / total

    def calculate_gdp(self) -> float:
        """
        Calculates the GDP,
        or the value of all goods produced by industries at the current step.

        Returns:
            gdp(float): The value of goods and services produced by the industries in the simulation.
        """

        # TODO: Implement calculation of the GDP
        # see https://www.investopedia.com/terms/b/bea.asp for notes
        # It's from the project documentation back in the spring

        return 0

    def calculate_income_per_capita(self):
        """
        Calculates the income per capita,
        or the average per step(weekly) income per person in the simulation.

        Returns:
            average_income(float): The average income per person(capita) in the simulation.
        """
        peopleAgents = self.agents_by_type[PersonAgent]
        total = len(peopleAgents)
        return peopleAgents.agg(
            "income", lambda incomes: sum(incomes) / total if total > 0 else 0
        )

    def calculate_median_income(self):
        """
        Calculates the median income of people within the simulation.

        Returns:
            median_income(float): The median income of people in the simulation.
        """
        peopleAgents = self.agents_by_type[PersonAgent]
        return peopleAgents.agg("income", lambda incomes: statistics.median(incomes))

    def calculate_hoover_index(self):
        """
        Calculates the Hoover Index,
        a measure of income inequality(ranges from 0-1),
        at the current timestep.

        Returns:
            hoover_index(float): squared income proportions from 0-1
        """

        # TODO: Implement calculation of the Hoover Index
        # see https://www.wallstreetoasis.com/resources/skills/economics/hoover-index
        # for the formula. It's from the project documentation back in the spring

        return 0

    def calculate_lorenz_curve(self):
        """
        Calculates the Lorenz Cruve at the current timestep.

        Returns:
            _type_: _description_
        """
        # TODO: Implement calculation of the Lorenz Curve
        # see https://www.datacamp.com/tutorial/lorenz-curve for info
        # it's from the project documentation back in the spring

        # note: it might make more sense to use the gini coefficient since
        # that is a single number, and is based on the lorenz curve anyways.
        # see https://www.datacamp.com/blog/gini-coefficient for more info on it.

        return 0
