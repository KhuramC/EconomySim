import pytest
from pytest import mark
from contextlib import nullcontext
from engine.core.model import EconomyModel
from engine.types.industry_type import IndustryType


@mark.parametrize(
    "delete_values,exception",
    [
        pytest.param(False, nullcontext(), id="valid_policies"),
        pytest.param(True, pytest.raises(ValueError), id="invalid_policies"),
    ],
)
def test_validate_schema(model: EconomyModel, policies, delete_values: bool, exception):
    """
    Test for `validate_schema`.
    Tests whether a it can validate a correct schema and invalidate an invalid schema.

    Args:
       controller (ModelController): the controller being used.
        policies (dict): a valid policies.
        delete_values (bool): whether to delete values from policies
        exception: the exception expected to occur.
    """
    # TODO: add parameters for doing this with demographics as well.
    new_policies = policies.copy()
    if delete_values:
        del new_policies["corporate_income_tax"]
    with exception:
        model.validate_schema(new_policies)


@mark.xfail(reason="Function has not been implemented yet.")
def test_setup_person_agents(model: EconomyModel):
    assert False


@pytest.mark.parametrize("industry_type", list(IndustryType))
def test_get_employees(model: EconomyModel, industry_type: IndustryType):
    """
    Test for `get_employees`.
    Ensures that each employee has employees, as currently implemented.

    Args:
        model (EconomyModel): a freshly created model.
        industry_type (IndustryType): the industry type being tested.
    """
    assert len(model.get_employees(industry_type)) == 0
    # TODO: redo this whenever starting unemployment logic changes


@mark.xfail(reason="Function has not been implemented yet.")
def test_inflation(model: EconomyModel):
    assert False


@mark.xfail(reason="Testing for the step function has not been considered quite yet.")
def test_step(model: EconomyModel):
    assert False


@mark.xfail(reason="Function has not been implemented yet.")
def test_reverse_step(model: EconomyModel):
    assert False
