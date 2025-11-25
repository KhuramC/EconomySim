import numpy as np
from ..types.industry_type import IndustryType
from ..types.demographic import Demographic


DEMOGRAPHICS_SCHEMA = {
    demo.value: {
        "income": {"mean": None, "sd": None},
        "proportion": None,
        "spending_behavior": {itype.value: None for itype in IndustryType},
        "balance": {"mean": None, "sd": None},
    }
    for demo in Demographic
}
"""Schema for validating the demographics dictionary."""

INDUSTRIES_SCHEMA = {
    itype.value: {
        "starting_price": None,
        "starting_inventory": None,
        "starting_balance": None,
        "starting_offered_wage": None,
        "starting_fixed_cost": None,
        "starting_raw_mat_cost": None,
        "starting_number_of_employees": None,
        "starting_worker_efficiency": None,
        "starting_debt_allowed": None,
        "starting_demand_intercept": None,
        "starting_demand_slope": None,
    }
    for itype in IndustryType
}
"""Schema for validating the industries dictionary."""

POLICIES_SCHEMA = {
    "corporate_income_tax": {itype.value: None for itype in IndustryType},
    "personal_income_tax": None,
    "sales_tax": {itype.value: None for itype in IndustryType},
    "property_tax": {"residential": None, "commercial": None},
    "tariffs": {itype.value: None for itype in IndustryType},
    "subsidies": {itype.value: None for itype in IndustryType},
    "price_cap": {itype.value: None for itype in IndustryType},
    "price_cap_enabled": {itype.value: None for itype in IndustryType},
    "minimum_wage": None,
}
"""Schema for validating the policies dictionary."""


def validate_schema(data: dict, schema: dict, path: str):
    """
    Recursively validates `data` against `schema`,
    ensuring the keys for every dictionary and sub-dictionary exist.

    Args:
        data (dict): the dictionary to validate.
        schema(dict): the dictionary to validate against.
        path (str, optional): name of dict variable.

    Raises:
        ValueError: if the `data` does not match schema, or is None.
    """
    if data is None or not isinstance(data, dict):
        raise ValueError(
            f"Data is not a dictionary at {path} even though it was expected."
        )

    missing = set(schema.keys()) - set(data.keys())
    if missing:
        raise ValueError(f"Missing keys at {path}: {missing}")

    for key, subschema in schema.items():
        if isinstance(subschema, dict):
            validate_schema(data[key], subschema, path=f"{path}[{key}]")


def num_prop(ratio: list[int | float], total: int):
    """
    Calculates the whole number in each category based on the proportion of the total.

    Args:
        ratio (list): the proportion associated with category.
        total (int): the total number of items.
    """
    if total == 0:
        return np.zeros(len(ratio))
    if ratio == []:
        return []
    np_ratio = np.asarray(ratio)
    cum_prop = np.cumsum(np.insert(np_ratio.ravel(), 0, 0))  # cumulative proportion
    return np.diff(np.round(total / cum_prop[-1] * cum_prop).astype(int)).reshape(
        np_ratio.shape
    )


def generate_lognormal(log_mean: float, log_std: float, size: int):
    """
    Generates n observations from a lognormal distribution.

    Args:
        log_mean (float): The desired mean of the lognormal distribution.
        log_std (float): The desired standard deviation of the lognormal distribution.
        size (int): The number of observations to generate (n).

    Returns:
        np.ndarray: An array of random samples.
    """
    # Convert to the parameters of the underlying normal distribution
    mu_underlying = np.log(log_mean**2 / np.sqrt(log_std**2 + log_mean**2))
    sigma_underlying = np.sqrt(np.log(1 + (log_std**2 / log_mean**2)))

    # Generate the samples
    return np.random.lognormal(mean=mu_underlying, sigma=sigma_underlying, size=size)
