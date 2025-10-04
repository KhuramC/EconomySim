import pytest
from pytest import mark
from contextlib import nullcontext
from engine.types.industry_type import IndustryType


def test_create_model(controller, demographics, policies):
    model_id = controller.create_model(100, demographics, policies)
    assert controller.next_id == model_id + 1


# TODO: implement tests based on city templates working correctly as expected.


@mark.parametrize(
    "model_id,exception",
    [
        pytest.param(1, nullcontext(1), id="valid_id"),
        pytest.param(2, pytest.raises(ValueError), id="invalid_id"),
    ],
)
def test_delete_model(controller, demographics, policies, model_id, exception):
    controller.create_model(100, demographics, policies)

    with exception:
        controller.delete_model(model_id)
        assert model_id not in controller.models


@mark.xfail(reason="Feature not implemented yet.")
def test_step_model(controller, demographics, policies):
    assert False


def test_get_policies(controller, demographics, policies):
    model_id = controller.create_model(100, demographics, policies)
    retrieved_policies = controller.get_policies(model_id)
    assert retrieved_policies == policies


def test_set_policies(controller, demographics, policies):
    model_id = controller.create_model(100, demographics, policies)
    new_policies = policies.copy()
    new_policies["corporate_income_tax"][IndustryType.AUTOMOBILES] = 0.25
    controller.set_policies(model_id, new_policies)
    retrieved_policies = controller.get_policies(model_id)
    assert retrieved_policies == new_policies


@mark.xfail(reason="Feature not implemented yet.")
def test_get_indicators(controller, demographics, policies):
    assert False


@mark.parametrize(
    "model_id,exception",
    [
        pytest.param(1, nullcontext(1), id="valid_id"),
        pytest.param(2, pytest.raises(ValueError), id="invalid_id"),
    ],
)
def test_get_model(controller, demographics, policies, model_id, exception):
    controller.create_model(100, demographics, policies)
    with exception as e:
        model = controller.get_model(model_id)
        assert model is controller.models[model_id]
