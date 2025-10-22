import pytest
from pytest import mark
import numpy as np
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

@pytest.mark.parametrize(
    "mean, std",
    [
        (100, 10),    # Low variance
        (5000, 1500), # High variance
        (800, 300)    # Medium variance
    ]
)
def test_generate_lognormal_statistics(model: EconomyModel, mean, std):
    """
    Tests that the generated distribution has approximately the
    mean and standard deviation that were requested.
    
    This is a stochastic test, so it uses a large sample size
    and pytest.approx for assertions.
    """
    size = 1_000_000  # Large sample size for statistical accuracy
    results = model.generate_lognormal(mean, std, size)

    # Check that the actual mean and std are close to the desired values
    # We use a relative tolerance of 1% (rel=0.01)
    assert np.mean(results) == pytest.approx(mean, rel=0.01)
    assert np.std(results) == pytest.approx(std, rel=0.01)

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
