import pytest
from engine.interface.controller import ModelController


@pytest.fixture()
def controller() -> ModelController:
    """
    A fixture for creating a `ModelController` and ensuring it initialized correctly.
    """

    controller = ModelController()
    assert controller.models == {}
    assert controller.next_id == 1
    return controller


@pytest.fixture()
def controller_model(
    controller: ModelController, demographics, industries, policies, num_agents: int
) -> dict:
    """
    Fixture for returning the model id of a created model
    and the controller associated with it.
    As a result, it is a test for `create_model`
    and ensures that the controller is correctly making a new model.

    Args:
        controller (ModelController): The model controller.
        demographics (dict): A valid demographics dict.
        industries (dict): A valid industries dict.
        policies (dict): A valid policies dict.
        num_agents (int): The number of agents in the model.

    Returns:
        dict: a dict with the keys "model_id" and "controller", holding the model id and controller.
    """

    model_id = controller.create_model(
        max_simulation_length=52,
        num_people=num_agents,
        demographics=demographics,
        industries=industries,
        starting_policies=policies,
    )

    assert model_id in controller.models
    assert controller.models[model_id].policies == policies
    assert controller.next_id == model_id + 1

    return {"model_id": model_id, "controller": controller}
