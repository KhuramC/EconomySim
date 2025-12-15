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
from ..types.demographic_metrics import DemoMetrics
from .indicators import *
from .utils import (
    validate_schema,
    POPULATION_SCHEMA,
    INDUSTRIES_SCHEMA,
    POLICIES_SCHEMA,
    num_prop,
    generate_lognormal,
)


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
        population: dict[
            str, int | float | dict[str, float] | dict[str, dict[IndustryType, float]]
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
        validate_schema(population, POPULATION_SCHEMA, path="demographics")
        validate_schema(industries, INDUSTRIES_SCHEMA, path="industries")
        validate_schema(starting_policies, POLICIES_SCHEMA, path="policies")

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
                DemoMetrics.PROPORTION: calculate_proportion,
                DemoMetrics.AVERAGE_BALANCE: calculate_average_balance,
                DemoMetrics.STD_BALANCE: calculate_std_balance,
                DemoMetrics.AVERAGE_WAGE: calculate_average_wage,
                DemoMetrics.STD_WAGE: calculate_std_wage,
            },
            agenttype_reporters={
                IndustryAgent: {
                    IndustryMetrics.PRICE: "price",
                    IndustryMetrics.INVENTORY: "inventory",
                    IndustryMetrics.BALANCE: "balance",
                    IndustryMetrics.WAGE: "offered_wage",
                    IndustryMetrics.NUM_EMPLOYEES: "num_employees",
                }
            },
        )

        self.setup_person_agents(num_people, population)
        self.setup_industry_agents(industries)

        # Ensure AgentSets exists, even if empty
        if PersonAgent not in self.agents_by_type:
            self.agents_by_type[PersonAgent] = AgentSet([], self)
        if IndustryAgent not in self.agents_by_type:
            self.agents_by_type[IndustryAgent] = AgentSet([], self)

    def setup_person_agents(
        self,
        total_people: int,
        population: dict[
            str, int | float | dict[str, float] | dict[str, dict[IndustryType, float]]
        ],
        preference_concentration: float = 20.0,
    ) -> None:
        """
        Creates the PersonAgents based on the populations dictionary.

        Args:
            total_people (int): the total number of PersonAgents to create.
            population (dict): the information about personAgents to create.
            preference_concentration (float): A parameter to control preference variance.
                Higher values mean agents will have preferences closer to the demographic's
                average (low variance). Lower values create more diverse preferences.

        Raises:
            ValueError: if the demographics dictionary is invalid.
        """
        agent_demographics = []
        agent_preferences = []
        agent_incomes = generate_lognormal(
            population.get("income_mean"), population.get("income_std"), total_people
        )
        agent_balances = generate_lognormal(
            population.get("balance_mean"), population.get("balance_std"), total_people
        )

        # Demographics (derived from income)
        median_income = np.median(agent_incomes)
        low_threshold = 0.67 * median_income
        high_threshold = 2.0 * median_income

        for income in agent_incomes:  # Iterate over every agent

            if income < low_threshold:
                assigned_demo = Demographic.LOWER_CLASS
            elif income > high_threshold:
                assigned_demo = Demographic.UPPER_CLASS
            else:
                assigned_demo = Demographic.MIDDLE_CLASS

            agent_demographics.append(assigned_demo)

            # Generate unique preferences from dirichlet distribution
            spending_behavior = population.get("spending_behavior").get(assigned_demo)
            industries_list = list(spending_behavior.keys())
            alphas = list(spending_behavior.values())
            concentrated_alphas = [val * preference_concentration for val in alphas]
            pref_vector = np.random.dirichlet(concentrated_alphas)
            pref_dict = {
                industries_list[i]: pref_vector[i] for i in range(len(industries_list))
            }
            agent_preferences.append(pref_dict)

        # Create Agents
        PersonAgent.create_agents(
            model=self,
            n=total_people,
            demographic=agent_demographics,
            income=agent_incomes,
            starting_balance=agent_balances,
            preferences=agent_preferences,
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
        # TODO: Distribute starting employment based on num_employees
        for industry_type, industry_info in industries.items():
            if not isinstance(industry_info, dict):
                raise ValueError(
                    f"Industry info must be a dictionary at industries[{industry_type}]."
                )

            IndustryAgent.create_agents(
                model=self,
                n=1,
                industry_type=industry_type,
                starting_price=industry_info.get("starting_price", 0.0),
                starting_inventory=industry_info.get("starting_inventory", 0),
                starting_balance=industry_info.get("starting_balance", 0.0),
                starting_offered_wage=industry_info.get("starting_offered_wage", 0.0),
                starting_fixed_cost=industry_info.get("starting_fixed_cost", 0.0),
                starting_raw_mat_cost=industry_info.get("starting_raw_mat_cost", 0.0),
                starting_number_of_employees=industry_info.get(
                    "starting_number_of_employees", 0
                ),
                starting_worker_efficiency=industry_info.get(
                    "starting_worker_efficiency", 1.0
                ),
                starting_debt_allowed=industry_info.get("starting_debt_allowed", False),
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

    def inflation(self) -> None:
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

        self.inflation()

        # industry agents do their tasks
        industryAgents = self.agents_by_type[IndustryAgent]
        industryAgents.shuffle_do("determine_price")
        industryAgents.shuffle_do("produce_goods")
        industryAgents.shuffle_do("change_employment")

        # people agents do their tasks
        peopleAgents = self.agents_by_type[PersonAgent]
        indicators_df = self.datacollector.get_model_vars_dataframe()
        median_income = indicators_df['Median Income'].iloc[-1]
        
        peopleAgents.do("update_class", median_income)
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

    def get_week(self) -> int:
        """
        Get the current week of the simulation.

        Returns:
            week(int): The current week.
        """
        return self.week
