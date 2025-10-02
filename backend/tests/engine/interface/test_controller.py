import pytest
from pytest import mark
from contextlib import nullcontext


def test_create_model(controller, tax_rates):
    model_id = controller.create_model(None, 1, tax_rates)
    assert controller.next_id == model_id + 1


# TODO: implement tests based on city templates working correctly as expected.


@mark.parametrize(
    "model_id,exception",
    [
        pytest.param(1, nullcontext(1), id="valid_id"),
        pytest.param(2, pytest.raises(ValueError), id="invalid_id"),
    ],
)
def test_delete_model(controller, tax_rates, model_id, exception):
    controller.create_model(None, 1, tax_rates)

    with exception as e:
        controller.delete_model(model_id)
        assert model_id not in controller.models


@mark.xfail(reason="Feature not implemented yet.")
def test_step_model(controller):
    assert False


@mark.xfail(reason="Feature not implemented yet.")
def test_get_indicators(controller):
    assert False


@mark.parametrize(
    "model_id,exception",
    [
        pytest.param(1, nullcontext(1), id="valid_id"),
        pytest.param(2, pytest.raises(ValueError), id="invalid_id"),
    ],
)
def test_get_model(controller, tax_rates, model_id, exception):
    controller.create_model(None, 1, tax_rates)
    with exception as e:
        model = controller.get_model(model_id)
        assert model is controller.models[model_id]
