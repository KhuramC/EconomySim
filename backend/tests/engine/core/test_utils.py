import pytest
from pytest import mark
from contextlib import nullcontext
import numpy as np
from engine.core.utils import (
    validate_schema,
    POLICIES_SCHEMA,
    num_prop,
    generate_lognormal,
)


@mark.parametrize(
    "delete_values,exception",
    [
        pytest.param(False, nullcontext(), id="valid_policies"),
        pytest.param(True, pytest.raises(ValueError), id="invalid_policies"),
    ],
)
def test_validate_schema(policies, delete_values: bool, exception):
    """
    Test for `validate_schema`.
    Tests whether a it can validate a correct schema and invalidate an invalid schema.

    Args:
       controller (ModelController): the controller being used.
        policies (dict): a valid policies.
        delete_values (bool): whether to delete values from policies
        exception: the exception expected to occur.
    """
    # TODO: add parameters for doing this with demographics/industries as well.
    new_policies = policies.copy()
    if delete_values:
        del new_policies["corporate_income_tax"]
    with exception:
        validate_schema(new_policies, POLICIES_SCHEMA, path="policies")


@pytest.mark.parametrize(
    "ratio, total, expected",
    [
        # Simple case, ratio sums to 1
        ([0.5, 0.5], 100, [50, 50]),
        # Ratio does not sum to 1, should be normalized
        ([1, 1], 100, [50, 50]),
        # Floating point ratios
        ([0.25, 0.75], 100, [25, 75]),
        # Case with rounding
        ([0.33, 0.67], 100, [33, 67]),
        # Another rounding case, ensuring sum is correct
        ([1, 1, 1], 10, [3, 4, 3]),
        # Total is 0
        ([0.5, 0.5], 0, [0, 0]),
        # Empty ratio
        ([], 100, []),
        # Single item in ratio
        ([1], 100, [100]),
        # Ratios with zeros
        ([0.5, 0, 0.5], 100, [50, 0, 50]),
    ],
)
def test_num_prop(ratio, total, expected):
    """
    Test for `num_prop`.
    Tests whether it correctly calculates whole numbers from proportions.
    """
    result = num_prop(ratio, total)
    assert np.array_equal(result, np.array(expected))
    if total > 0 and ratio:
        assert result.sum() == total


@pytest.mark.parametrize(
    "mean, std",
    [
        (100, 10),  # Low variance
        (5000, 1500),  # High variance
        (800, 300),  # Medium variance
    ],
)
def test_generate_lognormal_statistics(mean: int, std: int):
    """
    Tests that the generated distribution has approximately the
    mean and standard deviation that were requested.

    This is a stochastic test, so it uses a large sample size
    and pytest.approx for assertions.
    """
    size = 1_000_000  # Large sample size for statistical accuracy
    results = generate_lognormal(mean, std, size)

    # Check that the actual mean and std are close to the desired values
    # We use a relative tolerance of 1% (rel=0.01)
    assert np.mean(results) == pytest.approx(mean, rel=0.01)
    assert np.std(results) == pytest.approx(std, rel=0.01)
