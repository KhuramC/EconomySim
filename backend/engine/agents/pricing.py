import math


def solve_quadratic_choose_higher(
    B: float, V: float, A: float, F: float
) -> float | None:
    """
    Helper function to solve B\\*Q^2 + (V - A)\\*Q + F = 0. The solution is based on the quadratic formula:
    Q = [ -(V-A) +- sqrt( (V-A)^2) - 4(B\\*F) ) ] / ( 2 \\* B )

    Args:
        B (float): slope of the demand curve
        V (float): variable cost per unit.
        A (float): intercept of the demand curve (price at quantity zero).
        F (float): fixed cost.

    Returns:
        root(float|None): the greatest real root of the equation. If there is no real root, returns None.
    """

    # quadratic coefficients
    a = B
    b = V - A
    c = F

    if abs(a) < 1e-12:
        # Degenerate: linear equation b*Q + c = 0 -> Q = -c/b
        if abs(b) < 1e-12:
            return None
        return -c / b

    discriminant = b * b - 4 * a * c
    if discriminant < 0:  # imaginary roots, disregard
        return None
    elif abs(discriminant) < 1e-12:  # value under sqrt is zero -> one real root
        q = -b / (2 * a)
        return q
    else:  # two real roots
        sqrt_disc = math.sqrt(discriminant)
        q1 = (-b + sqrt_disc) / (2 * a)
        q2 = (-b - sqrt_disc) / (2 * a)
        return max(q1, q2)


def avg_cost(A: float, B: float, V: float, F: float) -> int:
    """
    Calculates the quantity to produce using average cost pricing. Assuming all units are sold, the net profit is 0.
    Due to rounding, exact results may be slightly different.
    If average cost does not produce a solution, `linear_profit_max` is used instead.

    Args:
        A (float): intercept of the demand curve (price at quantity zero).
        B (float): slope of the demand curve.
        V (float): variable cost per unit.
        F (float): fixed cost.
    Returns:
        q_rounded (int): Suggested quantity to produce, rounded to nearest whole number.
    """

    unrounded_q = 0.0
    q_root = solve_quadratic_choose_higher(B, V, A, F)
    # clip to demand-feasible max (price nonnegative)
    q_demand_max = A / B if B > 0 else float("inf")

    # check if result is feasible
    if q_root is not None and q_root > 0 and q_root <= q_demand_max:
        # real, positive solution within max
        unrounded_q = q_root
    else:
        # if there are no real roots, there are no profitable production levels
        # instead, minimize loss via linear profit max equation with Marginal Cost = V
        q_adj = linear_profit_max(A, B, V)

        if q_adj <= 0:
            # If fallback yields zero quantity, average cost is not defined (division by 0).
            q_adj = 0
        unrounded_q = q_adj

    return round(unrounded_q)


# Nondiagnostic version: only returns price and quantity
def linear_profit_max(A: float, B: float, m: float, n: float = 0.0) -> int:
    """
    Description:
    -Returns a suggested quantity of goods to produce and sell for this tick, assuming the demand graph is linear.
    -Returned quantity will maximize profit for the industry, as long as all units are sold
    -Returned quantity is rounded to the nearest whole number, so there is some margin of error that may result in
    less than perfect results

    Equation for calculation:
    Q = (A - m) / (2B + n)

    Args:
        A (float): Intercept of the Demand Graph (price at quantity zero)
        B (float): Slope of the Demand Graph
        m (float): Marginal Cost graph intercept
        n (float): Marginal Cost graph slope
        Note: if Variable cost scales linearly with quantity produced,
            m = Variable Cost Per Unit
            n = 0
    Returns:
        Q_Rounded (float): Calculated Quantity, rounded to nearest whole number
    """
    denom = 2 * B + n
    if denom == 0:
        raise ValueError("Denominator 2B + n is zero — examine boundaries.")
    Q_star = (A - m) / denom
    Q_feas = max(Q_star, 0.0)
    Q_Rounded = round(Q_feas)
    return Q_Rounded


def linear_price(A, B, Q) -> float:
    """
    Returns a suggested price to sell goods, assuming the demand graph is linear and there is no competition

    Equation for Calculation:
    P = A - (B*Q)

    Args:
        A (float): Intercept of the Demand Graph (price at quantity zero)
        B (float): Slope of the Demand Graph
    Returns:
        Price_Rounded (float): Calculated Price, rounded to two decimal places ($X.XX)
    """
    P_at_Q = A - B * Q
    Price_Rounded = round(P_at_Q, 2)  # round to two decimal places
    return Price_Rounded


def quantity_from_price(A, B, P) -> int:
    """
        Finds Quantity from price equation
        Flip price equation.
        (A - P) / B = Q
    Args:
        A (float): intercept of the demand graph
        B (float): slope of the demand graph
        P (float): Price that good is to be sold at

    Returns:
        int: quantity that industry will produce at this price
    """
    if B != 0:
        Q_at_P = (A - P) / B
        return round(Q_at_P)  # round to whole number
