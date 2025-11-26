from ..types.industry_type import IndustryType
import math


def custom_round(x: float) -> int:
    """
    Round up if x is within 0.05 of the next whole number,
    otherwise round down.
    """
    lower = math.floor(x)
    upper = lower + 1

    # If x is within 0.05 of the upper integer, round up
    if upper - x <= 0.05:
        return upper
    else:
        return lower


def demand_func(
    sigma: float,
    budget: float,
    prefs: dict[IndustryType, float],
    prices: dict[IndustryType, float],
) -> dict[IndustryType, int]:
    """
    Calculates the quantity of each good to purchase based on the Marshallian demand function.

    Args:
        sigma (float): The elasticity of substitution.
        budget (float): The total money available to spend.
        prefs (dict): The preference weights for the available goods/industries.
        prices (dict): The prices of the available goods.
    Returns:
        A dictionary mapping each good/industry to the desired quantity.
    """

    valid_goods = [industry for industry in prefs if industry in prices]

    denominator = sum(
        (prefs[industry] ** sigma) * (prices[industry] ** (1 - sigma))
        for industry in valid_goods
    )

    if denominator == 0:
        return {industry: 0 for industry in valid_goods}

    demands = {}
    for industry in valid_goods:
        numerator = (prefs[industry] ** sigma) * (prices[industry] ** -sigma)

        quantity_unrounded = (numerator / denominator) * budget
        quantity = custom_round(quantity_unrounded)
        demands[industry] = quantity

    return demands
