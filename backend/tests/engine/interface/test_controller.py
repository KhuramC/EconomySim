import pytest
from pytest import mark
from contextlib import nullcontext
from engine.types.industry_type import IndustryType
from engine.interface.controller import ModelController


def test_create_model(controller: ModelController, demographics, policies):
    """
    Test for `create_model`.
    Ensures that the controller is correctly making a new model.

    Args:
        controller (ModelController): the controller being used.
        demographics (dict): a valid demographics.
        policies (dict): a valid policies.
    """

    model_id = controller.create_model(100, demographics, policies)
    assert controller.models[model_id].policies == policies
    assert controller.next_id == model_id + 1


@mark.parametrize(
    "model_id,exception",
    [
        pytest.param(1, nullcontext(1), id="valid_id"),
        pytest.param(2, pytest.raises(ValueError), id="invalid_id"),
    ],
)
def test_delete_model(
    controller: ModelController, demographics, policies, model_id: int, exception
):
    """
    Test for `delete_model`.
    Tests attempted deletion of a valid and invalid model id.

    Args:
        controller (ModelController): the controller being used.
        demographics (dict): a valid demographics.
        policies (dict): a valid policies.
        model_id (int): the id of the model to delete.
        exception: the expected exception.
    """
    controller.create_model(100, demographics, policies)

    with exception:
        controller.delete_model(model_id)
        assert model_id not in controller.models


@mark.xfail(reason="Testing the step function has not been determined yet.")
def test_step_model(controller: ModelController, demographics, policies):
    assert False


def test_get_policies(controller: ModelController, demographics, policies):
    """
    Test for `get_policies`.
    Tests that one can correctly retrieve the current policies of a model.

    Args:
        controller (ModelController): the controller being used.
        demographics (dict): a valid demographics.
        policies (dict): a valid policies.
    """

    model_id = controller.create_model(100, demographics, policies)
    retrieved_policies = controller.get_policies(model_id)
    assert retrieved_policies == policies


def test_set_policies(controller: ModelController, demographics, policies):
    """
    Test for `set_policies`.
    Tests that one can correctly set the current policies of a model.

    Args:
        controller (ModelController): the controller being used.
        demographics (dict): a valid demographics.
        policies (dict): a valid policies.
    """

    model_id = controller.create_model(100, demographics, policies)

    new_policies = policies.copy()
    new_policies["corporate_income_tax"][IndustryType.AUTOMOBILES] = 0.25
    controller.set_policies(model_id, new_policies)

    retrieved_policies = controller.get_policies(model_id)
    assert retrieved_policies == new_policies


@mark.xfail(reason="Testing the get_indicators function has not been determined yet.")
def test_get_indicators(controller: ModelController, demographics, policies):
    assert False


@mark.parametrize(
    "model_id,exception",
    [
        pytest.param(1, nullcontext(1), id="valid_id"),
        pytest.param(2, pytest.raises(ValueError), id="invalid_id"),
    ],
)
def test_get_model(
    controller: ModelController, demographics, policies, model_id: int, exception
):
    """
    Parametrized test for `get_model`.
    Tests attempted get of a valid and invalid model id.

    Args:
        controller (ModelController): the controller being used.
        demographics (dict): a valid demographics.
        policies (dict): a valid policies.
        model_id (int): the id of the model to get.
        exception: the expected exception.
    """
    controller.create_model(100, demographics, policies)
    with exception:
        model = controller.get_model(model_id)
        assert model is controller.models[model_id]
