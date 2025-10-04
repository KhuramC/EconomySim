import pytest
from pytest import mark
from contextlib import nullcontext


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
