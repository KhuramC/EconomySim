import numpy as np
from mesa import Model
from mesa.agent import AgentSet
from mesa.datacollection import DataCollector

from ..agents.person import PersonAgent
from ..agents.industry import IndustryAgent
from ..types.industry_type import IndustryType
from ..types.demographic import Demographic
from ..types.indicators import Indicators
from ..types.industry_metrics import IndustryMetrics
from .indicators import *

demographics_schema = {
    demo.value: {
        "income": {"mean": None, "sd": None},
        "proportion": None,
        "unemployment_rate": None,
        "spending_behavior": {itype.value: None for itype in IndustryType},
        "balance": {"mean": None, "sd": None},
    }
    for demo in Demographic
}
"""Schema for validating the demographics dictionary."""

industries_schema = {
    itype.value: {"price": None, "inventory": None, "balance": None, "offered_wage": None}
    for itype in IndustryType
}
"""Schema for validating the industries dictionary."""

policies_schema = {
    "corporate_income_tax": {itype.value: None for itype in IndustryType},
    "personal_income_tax": {demo.value: None for demo in Demographic},
    "sales_tax": {itype.value: None for itype in IndustryType},
    "property_tax": None,
    "tariffs": {itype.value: None for itype in IndustryType},
    "subsidies": {itype.value: None for itype in IndustryType},
    "price_cap": {itype.value: None for itype in IndustryType},
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

    policies: dict[str, float | dict[IndustryType | Demographic, float]]
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
        starting_policies: dict[str, float | dict[IndustryType | Demographic, float]],
        inflation_rate: float = 0.001,
        random_events: bool = False,
    ):
        super().__init__()

        if max_simulation_length <= 0:
            raise ValueError("Maximum simulation length must be positive.")
        if num_people < 0:
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
                "week": self.get_week,
                Indicators.UNEMPLOYMENT: calculate_unemployment,
                Indicators.GDP: calculate_gdp,
                Indicators.INCOME_PER_CAPITA: calculate_income_per_capita,
                Indicators.MEDIAN_INCOME: calculate_median_income,
                Indicators.HOOVER_INDEX: calculate_hoover_index,
                Indicators.LORENZ_CURVE: calculate_lorenz_curve,
                Indicators.GINI_COEFFICIENT: calculate_gini_coefficient,
            },
            agenttype_reporters={
                IndustryAgent: {
                    IndustryMetrics.PRICE: "price",
                    IndustryMetrics.INVENTORY: "inventory",
                    IndustryMetrics.BALANCE: "balance",
                    IndustryMetrics.WAGE: "offered_wage",
                }
            },
        )

        self.setup_person_agents(num_people, demographics)
        self.setup_industry_agents(industries)

        # Ensure AgentSets exists, even if empty
        if PersonAgent not in self.agents_by_type:
            self.agents_by_type[PersonAgent] = AgentSet([], self)
        if IndustryAgent not in self.agents_by_type:
            self.agents_by_type[IndustryAgent] = AgentSet([], self)

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
        preference_concentration: float = 20.0,
    ) -> None:
        """
        Creates the PersonAgents based on the demographics dictionary.

        Args:
            total_people (int): the total number of PersonAgents to create.
            demographics (dict): the information about each demographics to create.
            preference_concentration (float): A parameter to control preference variance.
                Higher values mean agents will have preferences closer to the demographic's
                average (low variance). Lower values create more diverse preferences.

        Raises:
            ValueError: if the demographics dictionary is invalid.
        """

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

        # for each demographic...
        for demographic, demo_info in demographics.items():

            num_demo_people = demo_people[demographic]
            if num_demo_people == 0:
                continue

            income_info = demo_info.get("income", {})
            starting_balance_info = demo_info.get("balance", {})
            spending_behavior_info = demo_info.get("spending_behavior")

            # TODO: set unemployment based on starting_unemployment_rate per demographic
            # actually do something with unemployment rate
            unemployment_rate = demo_info.get("unemployment_rate", 0)

            # TODO: set savings_rate per demographic
            # Does this also get randomized?
            savings_rate = demo_info.get("savings_rate", 0.10)

            # Generate distributed parameters for N agents
            # Incomes from lognormal distribution
            incomes = self.generate_lognormal(
                log_mean=income_info.get("mean", 0),
                log_std=income_info.get("sd", 0),
                size=num_demo_people,
            )
            # Account balances from lognormal distribution
            starting_balances = self.generate_lognormal(
                log_mean=starting_balance_info.get("mean", 0),
                log_std=starting_balance_info.get("sd", 0),
                size=num_demo_people,
            )

            # Generate unique preferences from dirichlet distribution
            industries = list(spending_behavior_info.keys())
            alphas = list(spending_behavior_info.values())
            concentrated_alpha = [
                val * preference_concentration for val in alphas
            ]  # Scale alphas to control variance
            generated_preferences = np.random.dirichlet(
                concentrated_alpha, size=num_demo_people
            )

            pref_list = []  # holds preference dict for all N agents in demographic
            for pref_vector in generated_preferences:
                pref_dict = {
                    industries[i]: pref_vector[i] for i in range(len(industries))
                }
                pref_list.append(pref_dict)

            # TODO: Distribute starting employment based on unemployment_rate

            PersonAgent.create_agents(
                model=self,
                n=num_demo_people,
                demographic=demographic,
                income=incomes,
                starting_balance=starting_balances,
                preferences=pref_list,
                # TODO:
                # savings_rate=savings_rate,
                # employer=None,
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
            starting_balance = industry_info.get("balance", 0.0)
            starting_offered_wage = industry_info.get("offered_wage", 0.0)

            IndustryAgent.create_agents(
                model=self,
                n=1,
                industry_type=industry_type,
                starting_price=starting_price,
                starting_inventory=starting_inventory,
                starting_balance=starting_balance,
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
        """
        Applies the weekly inflation rate to all industry costs and
        the minimum wage policy. This is a "cost-push" inflation model.
        """

        industryAgents = self.agents_by_type[IndustryAgent]
        for agent in industryAgents:
            agent.raw_mat_cost *= 1 + self.inflation_rate
            agent.fixed_cost *= 1 + self.inflation_rate

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
