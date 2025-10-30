from typing import Iterable
import pandas as pd
from ..core.model import EconomyModel
from ..agents.industry import IndustryAgent

from ..types.industry_type import IndustryType
from ..types.demographic import Demographic
from ..types.indicators import Indicators


class ModelController:
    """
    Controller class to manage multiple EconomyModel instances.

    Attributes:
        models (dict): A dictionary mapping model IDs to EconomyModel instances.
        next_id (int): The next available model ID.
    """

    models: dict[int, EconomyModel] = {}
    """A dictionary mapping model IDs to EconomyModel instances."""
    # if necessary this might be moved to a database.

    next_id: int = 1
    """The next available model ID."""

    def __init__(self):
        self.models = {}

    def create_model(
        self,
        max_simulation_length: int,
        num_people: int,
        demographics: dict[
            Demographic, dict[str, float | dict[str | IndustryType, float]]
        ],
        industries: dict[IndustryType, dict[str, float | int]],
        starting_policies: dict[str, float | dict[IndustryType, float]],
        inflation_rate: float = 0.0001,
        random_events: bool = False,
    ) -> int:
        """
        Create a new EconomyModel instance and store it in the models dictionary.

        Args:
            max_simulation_length (int): The maximum length of the simulation in weeks.
            num_people (int): The number of people to create in the model.
            demographics (dict): A dictionary defining the demographics of the population.
            starting_policies (dict): A dictionary of policies to apply in the model.
            industries (dict): A dictionary defining the industries in the model.
            inflation_rate (float): The weekly inflation rate to apply in the model.
            random_events (bool): Whether to enable random events in the model.

        Returns:
            model_id: The unique ID associated with the model created.

        Raises:
            ValueError: if the policies or demographics were not validated.

        """
        try:
            model = EconomyModel(
                max_simulation_length=max_simulation_length,
                inflation_rate=inflation_rate,
                num_people=num_people,
                random_events=random_events,
                demographics=demographics,
                starting_policies=starting_policies,
                industries=industries,
            )
            model_id = self.next_id
            self.models[model_id] = model

            # increment next_id for future models
            self.next_id = self.next_id + 1
            return model_id
        except ValueError as e:
            raise ValueError(
                f"Demographics/industries/policies not validated: {str(e)}"
            )

    def delete_model(self, model_id: int) -> None:
        """
        Delete the specified model.

        Args:
            model_id (int): The unique identifier for the model to delete.

        Raises:
            ValueError: If the model associated with the model_id does not exist.
        """

        if model_id in self.models:
            del self.models[model_id]
        else:
            raise ValueError(f"Model with ID {model_id} does not exist.")

    def step_model(self, model_id: int, time: int = 1) -> None:
        """
        Advance the specified model by the amount of steps.

        Args:
            model_id (int): The unique identifier for the model to step.
            time (int): The number of steps to advance the model.

        Raises:
            ValueError: If the model associated with the model_id does not exist.
        """
        model = self.get_model(model_id)
        if time < 0:
            for _ in range(abs(time)):
                model.reverse_step()
        else:
            for _ in range(time):
                model.step()

    def get_policies(
        self, model_id: int
    ) -> dict[str, float | dict[IndustryType, float]]:
        """
        Retrieve the current policies from the specified model.

        Args:
            model_id (int): The unique identifier for the model to retrieve policies from.

        Returns:
            policies (dict): A dictionary containing the current policies of the model.

        Raises:
            ValueError: If the model associated with the model_id does not exist.
        """
        model = self.get_model(model_id)
        return model.policies

    def set_policies(
        self, model_id: int, policies: dict[str, float | dict[IndustryType, float]]
    ) -> None:
        """
        Update the policies in the specified model.

        Args:
            model_id (int): The unique identifier for the model to change policies in.
            policies (dict): A dictionary of policies to apply in the model.

        Raises:
            ValueError: If the model associated with the model_id does not exist
            or if the policies are not in the correct format.
        """

        model = self.get_model(model_id)
        model.validate_schema(policies)
        model.policies = policies

    def get_current_week(self, model_id: int) -> int:
        """
        Retrieve the current week from the specified model.

        Args:
            model_id (int): The unique identifier for the model to retrieve indicators from.
        Returns:
            current_week (int): The current week for the model.

        Raises:
            ValueError: If the model associated with the model_id does not exist.
        """

        model = self.get_model(model_id)
        return model.get_week()

    def get_industry_data(
        self,
        model_id: int,
        start_time: int = 0,
        end_time: int = 0,
        industries: Iterable[IndustryType] | None = None,
    ) -> pd.DataFrame:
        """
        Retrieves industries information from the specified model.
        Columns include "week", "industry", "price", "inventory", "money", "wage", "industry".

        Args:
            model_id (int): The unique identifier for the model to retrieve industry information from.
            start_time (int): The starting time period for the industries.
            end_time (int): The ending time period for the industries. An end_time of 0 goes to the current time.
            industries (Iterable, optional): An iterable of the specific industries' whose information to retrieve. If None, retrieves all industries' information.
        
        Returns:
            dataframe (DataFrame): A DataFrame containing the requested industries' information.

        Raises:
            ValueError: If the model associated with the model_id does not exist, \\
                if the start_time or end_time are invalid, \\
        """
        # parameter validation
        if start_time < 0 or end_time < 0 or (end_time != 0 and end_time < start_time):
            raise ValueError("Invalid start_time or end_time values.")

        model = self.get_model(model_id)

        industries_df: pd.DataFrame = model.datacollector.get_agenttype_vars_dataframe(
            IndustryAgent
        )

        # TODO: check for potential edge cases for when doing reverse step
        # if a reverse step occurs, there would be multiple rows where week is some x value
        industries_df.reset_index(inplace=True)
        # Rename 'Step' to 'week' to match indicators dataframe
        industries_df.rename(columns={"Step": "week"}, inplace=True)

        # map AgentID column to industry name
        industry_agents = model.agents_by_type[IndustryAgent]
        agent_id_to_industry = {
            agent.unique_id: agent.industry_type for agent in industry_agents
        }
        industries_df["industry"] = industries_df["AgentID"].map(agent_id_to_industry)
        industries_df = industries_df.drop(columns=["AgentID"])

        # filter by time
        current_week = model.get_week()
        effective_end_time = current_week if end_time == 0 else end_time
        industries_df = industries_df[
            industries_df["week"].between(
                start_time, effective_end_time, inclusive="both"
            )
        ]

        # filter by industries
        if industries:
            industries_df = industries_df[industries_df["industry"].isin(industries)]

        return industries_df

    def get_indicators(
        self,
        model_id: int,
        start_time: int = 0,
        end_time: int = 0,
        indicators: Iterable[Indicators] | None = None,
    ) -> pd.DataFrame:
        """
        Retrieve economic indicators from the specified model.
        Columns include "week" and whatever indicator is requested.

        Args:
            model_id (int): The unique identifier for the model to retrieve indicators from.
            start_time (int): The starting time period for the indicators.
            end_time (int): The ending time period for the indicators. An end_time of 0 goes to the current time.
            indicators (Iterable, optional): An iterable of specific indicators to retrieve. If None, retrieves all indicators.

        Returns:
            dataframe (DataFrame): A DataFrame containing the requested economic indicators.

        Raises:
            ValueError: If the model associated with the model_id does not exist, \\
                if the start_time or end_time are invalid, \\
                or if one or more requested indicators are not available.
        """

        # parameter validation
        if start_time < 0 or end_time < 0 or (end_time != 0 and end_time < start_time):
            raise ValueError("Invalid start_time or end_time values.")
        if indicators is not None and not all(
            ind in Indicators.values() for ind in indicators
        ):
            raise ValueError(
                f"One or more requested indicators are not available. Available indicators: {list(Indicators)}"
            )
        model = self.get_model(model_id)

        indicators_df: pd.DataFrame = model.datacollector.get_model_vars_dataframe()

        # filter by time
        current_week = model.get_week()
        effective_end_time = current_week if end_time == 0 else end_time
        indicators_df = indicators_df[
            indicators_df["week"].between(
                start_time, effective_end_time, inclusive="both"
            )
        ]

        # filter by indicators
        if indicators:
            # Always include the "week" column along with the requested indicators
            columns_to_keep = ["week"] + list(indicators)
            indicators_df = indicators_df[columns_to_keep]

        return indicators_df

    def get_model(self, model_id: int) -> EconomyModel:
        """
        Retrieve the specified model.

        Args:
            model_id (int): The unique identifier for the model to retrieve.

        Returns:
            EconomyModel: The requested EconomyModel instance.

        Raises:
            ValueError: If the model associated with the model_id does not exist.
        """

        if model_id in self.models:
            return self.models[model_id]
        else:
            raise ValueError(f"Model with ID {model_id} does not exist.")
