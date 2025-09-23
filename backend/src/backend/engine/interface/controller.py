from typing import Iterable
import pandas as pd
from ..core.model import EconomyModel

from ..types.IndustryType import IndustryType
from ..types.city_template import CityTemplate

available_indicators: tuple = (
    "Unemployment",
    "GDP",
    "IncomePerCapita",
    "MedianIncome",
    "HooverIndex",
    "LorenzCurve",
)
"""The indicators that can be retrieved from the model."""


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
        city_template: CityTemplate | None,
        num_people: int,
        tax_rates: dict[str, float | dict[IndustryType, float]],
        random_events: bool = False,
    ) -> int:
        """
        Create a new EconomyModel instance and store it in the models dictionary.

        Args:
            city_template (CityTemplate): The city template to use for the model.
            num_people (int): The number of people to create in the model.
            tax_rates (dict): A dictionary of tax rates to apply in the model.
            random_events (bool): Whether to enable random events in the model.

        Returns:
            model_id: The unique ID associated with the model created.

        """
        # apply city template settings first
        # TODO: Implement City Template logic
        match city_template:
            case CityTemplate.SMALL:
                pass
            case CityTemplate.MEDIUM:
                pass
            case CityTemplate.LARGE:
                pass
            case None:
                # what happens when no template is chosen. Use the other things passed in
                pass
            case _:
                raise ValueError(f"Unknown city template: {city_template}")

        model = EconomyModel(
            num_people=num_people, tax_rates=tax_rates, random_events=random_events
        )
        model_id = self.next_id
        self.models[model_id] = model

        # increment next_id for future models
        self.next_id = self.next_id + 1
        return model_id

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
            ValueError: If the model associated with the model_id does not exist or if time is less than 1
        """
        if time < 1:
            raise ValueError("Time must be a positive integer.")
        # TODO: handle negative time for reverses. Need to define a negative step so to speak

        if model_id in self.models:
            for i in range(time):
                self.models[model_id].step()
        else:
            raise ValueError(f"Model with ID {model_id} does not exist.")

    def get_indicators(
        self,
        model_id: int,
        start_time: int = 0,
        end_time: int = 0,
        indicators: Iterable[str] | None = None,
    ) -> pd.DataFrame:
        """
        Retrieve economic indicators from the specified model.

        Args:
            model_id (int): The unique identifier for the model to retrieve indicators from.
            start_time (int): The starting time period for the indicators.
            end_time (int): The ending time period for the indicators. An end_time of 0 goes to the current time.
            indicators (Iterable, optional): An interable of specific indicators to retrieve. If None, retrieves all indicators.

        Returns:
            dataframe (pd.DataFrame): A DataFrame containing the requested economic indicators.

        Raises:
            ValueError: If the model associated with the model_id does not exist, \\
                if the start_time or end_time are invalid, \\
                or if one or more requested indicators are not available.
        """

        # parameter validation
        if start_time < 0 or end_time < 0 or (end_time != 0 and end_time < start_time):
            raise ValueError("Invalid start_time or end_time values.")
        if indicators is not None and not all(
            ind in available_indicators for ind in indicators
        ):
            raise ValueError(
                f"One or more requested indicators are not available. Available indicators: {available_indicators}"
            )
        if model_id in self.models:

            indicators_df: pd.DataFrame = self.models[
                model_id
            ].datacollector.get_model_vars_dataframe()

            # filter by time
            if end_time == 0:
                end_time = self.models[model_id].get_week()
            indicators_df = indicators_df[
                indicators_df["Week"].between(start_time, end_time, inclusive="both")
            ]

            # filter by indicators
            if indicators is not None:
                indicators_df = indicators_df[list(indicators)]

            return indicators_df
        else:
            raise ValueError(f"Model with ID {model_id} does not exist.")

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
