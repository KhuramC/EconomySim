import pytest
from pytest import mark
from contextlib import nullcontext
from copy import deepcopy
from typing import Any
import numpy as np
from engine.core.utils import (
    validate_schema,
    POLICIES_SCHEMA,
    POPULATION_SCHEMA,
    INDUSTRIES_SCHEMA,
    num_prop,
    generate_lognormal,
)
from engine.types.industry_type import IndustryType
from engine.types.demographic import Demographic


@pytest.fixture()
def data(request, policies, population, industries) -> dict[str, Any]:
    """
    Based on the request, returns one of the following dicts.

    Args:
        request (_type_): which dict to return.
        policies (dict): a valid policies dict.
        population (dict): a valid population dict.
        industries (dict): a valid industries dict.

    Returns:
        dict: the dict requested.
    """
    wanted_data = request.param
    if wanted_data == "policies":
        return policies
    elif wanted_data == "population":
        return population
    elif wanted_data == "industries":
        return industries
    else:
        return {}


@pytest.fixture()
def invalid_data(request, policies, population, industries) -> dict[str, Any]:
    """
    Deletes a specified key somewhere in the requested dictionary to make it invalid.

    Args:
        request (_type_): which dict to return, and what key to delete.
        policies (dict): a valid policies dict.
        population (dict): a valid population dict.
        industries (dict): a valid industries dict.

    Returns:
        invalid_data (dict[str, Any]): The data after having a key removed.
    """
    wanted_data, key_path = request.param
    print(f"wanted_data: {wanted_data}, key_path: {key_path}")
    invalid_data = {}
    if wanted_data == "policies":
        invalid_data = deepcopy(policies)
    elif wanted_data == "population":
        invalid_data = deepcopy(population)
    elif wanted_data == "industries":
        invalid_data = deepcopy(industries)

    temp_dict = invalid_data
    for key in key_path[:-1]:  # get to second last key
        temp_dict = temp_dict[key]
    del temp_dict[key_path[-1]]  # delete last key

    return invalid_data


@mark.parametrize(
    "data, schema, path",
    [
        pytest.param(
            "policies",
            POLICIES_SCHEMA,
            "policies",
            id="valid_policies",
        ),
        pytest.param(
            "population",
            POPULATION_SCHEMA,
            "population",
            id="valid_population",
        ),
        pytest.param(
            "industries",
            INDUSTRIES_SCHEMA,
            "industries",
            id="valid_industries",
        ),
    ],
    indirect=["data"],
)
def test_validate_schema_success(
    data,
    schema: dict,
    path: str,
):
    """
    Test for `validate_schema`.
    Tests whether it can validate a correct schema.

    Args:
        data (dict): an valid data dict.
        schema (dict): the schema to validate against.
        path (str): the path of the schema.
    """
    with nullcontext():
        validate_schema(data, schema, path)


@mark.parametrize(
    "invalid_data, schema, path",
    [
        pytest.param(
            ("policies", ("corporate_income_tax",)),
            POLICIES_SCHEMA,
            "policies",
            id="invalid_policies",
        ),
        pytest.param(
            ("population", (Demographic.LOWER_CLASS, "proportion")),
            POPULATION_SCHEMA,
            "population",
            id="invalid_population",
        ),
        pytest.param(
            ("industries", (IndustryType.HOUSEHOLD_GOODS, "starting_price")),
            INDUSTRIES_SCHEMA,
            "industries",
            id="invalid_industries",
        ),
    ],
    indirect=["invalid_data"],
)
def test_validate_schema_failure(invalid_data, schema: dict, path: str):
    """
    Test for `validate_schema`.
    Tests whether it can invalidate an invalid schema.

    Args:
        invalid_data (dict): an invalid data dict.
        schema (dict): the schema to validate against.
        path (str): the path of the schema.
    """

    with pytest.raises(ValueError):
        validate_schema(invalid_data, schema, path)


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
