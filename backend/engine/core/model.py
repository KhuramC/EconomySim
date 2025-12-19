import numpy as np
from mesa import Model
from mesa.agent import AgentSet
from mesa.datacollection import DataCollector
from typing import Optional
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
    DEMOGRAPHICS_SCHEMA,
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
    
    model_demand_parameters: dict[IndustryType, tuple[float, Optional[float]]]
    """Stores the slope and price at quantity zero of the model's demand for each industry."""

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
        validate_schema(demographics, DEMOGRAPHICS_SCHEMA, path="demographics")
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

        self.setup_person_agents(num_people, demographics)
        self.setup_industry_agents(industries)

        # Ensure AgentSets exists, even if empty
        if PersonAgent not in self.agents_by_type:
            self.agents_by_type[PersonAgent] = AgentSet([], self)
        if IndustryAgent not in self.agents_by_type:
            self.agents_by_type[IndustryAgent] = AgentSet([], self)

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
        demo_people = num_prop(
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

            # TODO: set savings_rate per demographic
            # Does this also get randomized?
            savings_rate = demo_info.get("savings_rate", 0.10)

            # Generate distributed parameters for N agents
            # Incomes from lognormal distribution
            incomes = generate_lognormal(
                log_mean=income_info.get("mean", 0),
                log_std=income_info.get("sd", 0),
                size=num_demo_people,
            )
            # Account balances from lognormal distribution
            starting_balances = generate_lognormal(
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

        self.aggregate_person_demand_tangents() 
        
        # industry agents do their tasks
        industryAgents = self.agents_by_type[IndustryAgent]
        industryAgents.shuffle_do("get_demand_graph_params")
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

    def get_week(self) -> int:
        """
        Get the current week of the simulation.

        Returns:
            week(int): The current week.
        """
        return self.week


    def aggregate_person_demand_tangents(self):
        """
        Query every PersonAgent for their demand_tangent_tuple and aggregate results.

        Returns:
            dict where keys are industry names (strings) and values are tuples:
                (average_slope: float, average_price_at_zero: float | None)
        """

        people_agents = self.agents_by_type.get(PersonAgent)
        industry_agents = self.agents_by_type.get(IndustryAgent)

        # If no people or no industries, return empty dict
        if not people_agents or not industry_agents:
            return {}

        # Build prices dict keyed by IndustryType (as PersonAgent expects)
        prices: dict[IndustryType, float] = {
            ia.industry_type: ia.price * (1 + self.policies["sales_tax"][ia.industry_type]) for ia in industry_agents
        }

        # accumulators keyed by industry name (PersonAgent returns keys as strings)
        slope_acc: dict[IndustryType, list[float]] = {}
        pzero_acc: dict[IndustryType, list[float]] = {}

        for person in people_agents:
            # budget is determined by the person's own method
            budget = person.determine_budget()
            prefs = person.preferences

            # call person method with expected signature
            tangents = person.demand_tangent_tuple(budget=budget, prefs=prefs, prices=prices)

            # tangents: { "INDUSTRY_NAME": (slope, p_zero_or_None), ... }
            for industry_key, (slope, p_zero) in tangents.items():
                slope_acc.setdefault(industry_key, []).append(slope)
                if p_zero is not None:
                    pzero_acc.setdefault(industry_key, []).append(p_zero)

        # compute averages
        aggregated: dict[IndustryType, tuple[float, Optional[float]]] = {}
        for industry_key, slopes in slope_acc.items():
            avg_slope = np.mean(slopes) if slopes else 0.0
            pzeros = pzero_acc.get(industry_key, [])
            avg_pzero = np.mean(pzeros) if pzeros else None
            aggregated[industry_key] = (avg_slope, avg_pzero)

        # include industries that had p_zero values but no slopes (unlikely)
        for industry_key, pzeros in pzero_acc.items():
            if industry_key in aggregated:
                continue
            avg_pzero = np.mean(pzeros) if pzeros else None
            aggregated[industry_key] = (0.0, avg_pzero)

        self.model_demand_parameters = aggregated
