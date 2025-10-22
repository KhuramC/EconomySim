import statistics
import random
import numpy as np
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

industries_schema = {
    itype.value: {"price": None, "inventory": None, "money": None, "offered_wage": None}
    for itype in IndustryType
}

policies_schema = {
    "corporate_income_tax": {itype.value: None for itype in IndustryType},
    "personal_income_tax": None,
    "sales_tax": {itype.value: None for itype in IndustryType},
    "property_tax": None,
    "tariffs": {itype.value: None for itype in IndustryType},
    "subsidies": {itype.value: None for itype in IndustryType},
    "rent_cap": None,
    "minimum_wage": None,
}
"""Schema for validating the policies dictionary."""


class EconomyModel(Model):
    """
    The main model for the economic simulation.

    Attributes:
        max_simulation_length (int): The maximum length of the simulation in weeks.
        inflation_rate (float): The weekly inflation rate in the simulation.
        random_events (bool): Whether random events are enabled in the simulation.
        policies (dict): A dictionary of various tax rates in the simulation.
        week (int): The current week in the simulation.
    """

    # Set at the start of the simulation

    max_simulation_length: int
    """The maximum length of the simulation in weeks."""

    inflation_rate: float
    """The weekly inflation rate in the simulation."""

    random_events: bool
    """Whether random events are enabled in the simulation."""

    # Changeable by the user at any time

    policies: dict[str, float | dict[IndustryType, float]]
    """A dictionary of the various policies available to change in the simulation. Needs to match policies_schema."""

    week: int
    """The current week in the simulation."""

    def __init__(
        self,
        max_simulation_length: int,
        num_people: int,
        demographics: dict[
            Demographic, dict[str, float | dict[str | IndustryType, float]]
        ],
        industries: dict[IndustryType, dict[str, float | int]],
        starting_policies: dict[str, float | dict[IndustryType, float]],
        inflation_rate: float = 0.001,
        random_events: bool = False,
    ):
        super().__init__()

        if max_simulation_length <= 0:
            raise ValueError("Maximum simulation length must be positive.")
        if num_people <= 0:
            raise ValueError("A nonnegative amount of agents is required.")
        # check demographics/industries/policies has all necessary keys
        self.validate_schema(demographics, demographics_schema, path="demographics")
        self.validate_schema(industries, industries_schema, path="industries")
        self.validate_schema(starting_policies)

        self.max_simulation_length = max_simulation_length
        self.inflation_rate = inflation_rate
        self.random_events = random_events
        self.policies = starting_policies

        self.week = 0
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
        self.setup_industry_agents(industries)

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

    def num_prop(self, ratio, N):
        """Calculate numbers of total N in proportion to ratio"""
        ratio = np.asarray(ratio)
        p = np.cumsum(np.insert(ratio.ravel(), 0, 0))  # cumulative proportion
        return np.diff(np.round(N / p[-1] * p).astype(int)).reshape(ratio.shape)

    def generate_lognormal(self, log_mean: float, log_std: float, size: int):
        """
        Generates n observations from a lognormal distribution.

        Args:
            log_mean (float): The desired mean of the lognormal distribution.
            log_std (float): The desired standard deviation of the lognormal distribution.
            size (int): The number of observations to generate (n).

        Returns:
            np.ndarray: An array of random samples.
        """
        # Convert to the parameters of the underlying normal distribution
        mu_underlying = np.log(log_mean**2 / np.sqrt(log_std**2 + log_mean**2))
        sigma_underlying = np.sqrt(np.log(1 + (log_std**2 / log_mean**2)))

        # Generate the samples
        return np.random.lognormal(
            mean=mu_underlying, sigma=sigma_underlying, size=size
        )

    def setup_person_agents(
        self,
        total_people: int,
        demographics: dict[
            Demographic, dict[str, float | dict[str | IndustryType, float]]
        ],
    ) -> None:
        """
        Creates the PersonAgents based on the demographics dictionary.

        Args:
            total_people (int): the total number of PersonAgents to create.
            demographics (dict): the information about each demographics to create.

        Raises:
            ValueError: if the demographics dictionary is invalid.
        """
        # do same thing for each demographic

        # get number of people per demographic
        demo_people = self.num_prop(
            [
                demographics[demographic]["proportion"] * 100
                for demographic in demographics.keys()
            ],
            total_people,
        )
        demo_people = {
            demographic: demo_people[i]
            for i, demographic in enumerate(demographics.keys())
        }

        for demographic, demo_info in demographics.items():

            unemployment_rate = demo_info.get("unemployment_rate", 0)
            # TODO: set unemployment based on starting_unemployment_rate per demographic
            # actually do something with unemployment rate
            spending_behavior_info = demo_info.get("spending_behavior", {})
            # TODO: acutally use spending behavior when creating agents
            income_info = demo_info.get("income", {})
            current_money_info = demo_info.get("current_money", {})

            # param checking
            if isinstance(income_info, dict) and isinstance(current_money_info, dict):
                num_demo_people = demo_people[demographic]

                # uses lognormal distribution; sd represents right skew
                incomes = self.generate_lognormal(
                    log_mean=income_info.get("mean", 0),
                    log_std=income_info.get("sd", 0),
                    size=num_demo_people,
                )
                starting_moneys = self.generate_lognormal(
                    log_mean=current_money_info.get("mean", 0),
                    log_std=current_money_info.get("sd", 0),
                    size=num_demo_people,
                )

                PersonAgent.create_agents(
                    model=self,
                    n=num_demo_people,
                    demographic=demographic,
                    income=incomes,
                    current_money=starting_moneys,
                )

            else:
                raise ValueError(
                    f"Income and current_money must be dictionaries at demographics[{demographic}]."
                )

    def setup_industry_agents(
        self,
        industries: dict[IndustryType, dict[str, float | int]],
    ) -> None:
        """
        Creates the IndustryAgents based on the industries dictionary.

        Args:
            industries (dict): the information about each industry to create.

        Raises:
            ValueError: if the industries dictionary is invalid.
        """
        for industry_type, industry_info in industries.items():
            if not isinstance(industry_info, dict):
                raise ValueError(
                    f"Industry info must be a dictionary at industries[{industry_type}]."
                )
            starting_price = industry_info.get("price", 0.0)
            starting_inventory = industry_info.get("inventory", 0)
            starting_money = industry_info.get("money", 0.0)
            starting_offered_wage = industry_info.get("offered_wage", 0.0)

            IndustryAgent.create_agents(
                model=self,
                n=1,
                industry_type=industry_type,
                starting_price=starting_price,
                starting_inventory=starting_inventory,
                starting_money=starting_money,
                starting_offered_wage=starting_offered_wage,
            )

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

    def step(self) -> None:
        """
        Advance the simulation by one week, causing inflation, IndustryAgents and then PersonAgents to act.
        """
        if self.week >= self.max_simulation_length:
            return  # do not step past maximum simulation length
        self.week = self.week + 1  # new week

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

    def reverse_step(self) -> None:
        """
        Reverse the simulation by one week.
        """
        # TODO: Implement reversing simulation
        # might want to add choice of how much to reverse.
        pass

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
