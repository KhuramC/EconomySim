import math
from ..types.industry_type import IndustryType


def demand_func(
    sigma: float,
    budget: float,
    prefs: dict[IndustryType, float],
    prices: dict[IndustryType, float],
) -> dict[IndustryType, int]:
    """
    Calculates the quantity of each good to purchase based on the CES demand function.

    Args:
        budget: The total money available to spend.
        prefs: The preference weights for the available goods.
        prices: The prices of the available goods.
    Returns:
        A dictionary mapping each good's name to the desired quantity.
    """

    valid_goods = [name for name in prefs if name in prices]

    denominator = sum(
        (prefs[name] ** sigma) * (prices[name] ** (1 - sigma)) for name in valid_goods
    )

    if denominator == 0:
        return {name: 0 for name in valid_goods}

    demands = {}
    for name in valid_goods:
        numerator = (prefs[name] ** sigma) * (prices[name] ** -sigma)
        quantity_unrounded = (numerator / denominator) * budget #value is not rounded until purchase step.  This allows for savings accumulation.
        demands[name] = quantity_unrounded  

    return demands


def custom_round(x: float) -> int:
    """
    Round up if x is within 1e-9 of the next whole number,
    otherwise round down.
    """
    lower = math.floor(x)
    upper = lower + 1

    # If x is within 1e-9 (tolerance for floating point errors) of the upper integer, round up
    if upper - x <= 1e-9:
        return upper
    else:
        return lower
