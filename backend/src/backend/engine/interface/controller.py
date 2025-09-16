from ..core.model import EconomyModel

from ..types.IndustryType import IndustryType
from ..types.city_template import CityTemplate


class ModelController:

    models: dict[str, EconomyModel] = {}
    """A dictionary mapping model IDs to EconomyModel instances."""

    def __init__(self):
        self.models = {}

    def create_model(
        self,
        model_id: str,
        city_template: CityTemplate | None,
        num_people: int,
        tax_rates: dict[str, float | dict[IndustryType, float]],
        random_events: bool = False,
    ) -> EconomyModel:
        """
        Create a new EconomyModel instance and store it in the models dictionary.

        Args:
            model_id (str): The unique identifier for the model.
            city_template (CityTemplate): The city template to use for the model.
            num_people (int): The number of people to create in the model.
            tax_rates (dict): A dictionary of tax rates to apply in the model.
            random_events (bool): Whether to enable random events in the model.
        """
        # apply city template settings first
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
        self.models[model_id] = model
        return model

    def step_model(self, model_id: str):
        """
        Advance the specified model by one step.

        Args:
            model_id (str): The unique identifier for the model to step.
        """

        if model_id in self.models:
            self.models[model_id].step()
        else:
            raise ValueError(f"Model with ID {model_id} does not exist.")

    def get_model(self, model_id: str) -> EconomyModel:
        """
        Retrieve the specified model.

        Args:
            model_id (str): The unique identifier for the model to retrieve.

        Returns:
            EconomyModel: The requested EconomyModel instance.
        """

        if model_id in self.models:
            return self.models[model_id]
        else:
            raise ValueError(f"Model with ID {model_id} does not exist.")
