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

def demand_tangent_tuple(
        budget: float,
        sigma:float,
        prefs: dict[IndustryType, float],
        prices: dict[IndustryType, float],
    ) -> dict[IndustryType, tuple[float, float | None]]:
        """
        Produces a tuple representing the tangent line (slope and y-intercept) to the CES demand curve at the current price point.
        
        Args:
            budget: The total money available to spend.
            prefs: The preference weights for the available goods.
            prices: The prices of the available goods.
            epsilon: small value to avoid division by zero
        Returns:
            A dictionary mapping each good's name (its industry) to a tuple
            Tuple contains: ( slope_of_tangent, price_at_zero_quantity )
            - slope = dq/dp at the current price
            - price_at_zero = price where tangent line hits quantity = 0
              p_zero = p0 - q0 / slope
              Returns None if slope = 0 or result is not positive/finite.
        """

        valid_goods = [name for name in prefs if name in prices]

        A = {name: prefs[name] ** sigma for name in valid_goods}         #get spending preferences for each industry
        p = {name: max(prices[name], 1e-12) for name in valid_goods}   #clamp to zero

        # denominator of CES demand
        D = sum(A[name] * (p[name] ** (1 - sigma)) for name in valid_goods)

        # If denominator is zero, return zero slope & None zero-price
        if D <= 0:
            return {
                name: (0.0, None)
                for name in valid_goods
            }

        results = {}

        for name in valid_goods:
            Ai = A[name]
            pi = p[name]

            # quantity at current price (continuous)
            q0 = budget * (Ai * (pi ** (-sigma)) / D)
            #if sigma = 1, this is budget * (pref/price)
            
            # derivative dq/dp (own-price partial)
            B = budget
            dD_dpi = Ai * (1 - sigma) * (pi ** (-sigma))
            # if sigma = 1, dD_dpi = 0
            term1 = Ai * (-sigma) * (pi ** (-sigma - 1)) / D    #pref * -1 * (price ^ -2) = -pref/price^2
            term2 = Ai * (pi ** (-sigma)) * (-1) * dD_dpi / (D * D) #(pref * (price ^ -1) * -1 * 0) 
            slope = B * (term1 + term2)

            # compute tangent-line zero point
            if slope == 0 or not math.isfinite(slope):
                p_zero = None
            else:
                p_zero_candidate = pi - (q0 / slope)
                # only return positive finite price
                if math.isfinite(p_zero_candidate) and p_zero_candidate > 0:
                    p_zero = p_zero_candidate
                else:
                    p_zero = None

            results[name] = (slope, p_zero)

        return results