import pytest
from pytest import mark
from contextlib import nullcontext
from engine.types.industry_type import IndustryType


@mark.parametrize(
    "delete_values,exception",
    [
        pytest.param(False, nullcontext(), id="valid"),
        pytest.param(True, pytest.raises(ValueError), id="invalid"),
    ],
)
def test_validate_policies(model, policies, delete_values, exception):
    new_policies = policies.copy()
    if delete_values:
        del new_policies["corporate_income_tax"]
    with exception:
        model.validate_schema(new_policies)


@pytest.mark.parametrize("industry_type", list(IndustryType))
def test_get_employees(model, industry_type: IndustryType):
    assert len(model.get_employees(industry_type)) == 0
    # TODO: redo this whenever starting unemployment logic changes

@mark.xfail(reason="Function has not been implemented yet.")
def test_inflation():
    assert False

@mark.xfail(reason="Testing for the step function has not been considered quite yet.")
def test_step():
    assert False
