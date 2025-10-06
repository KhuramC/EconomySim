import math
from typing import Optional, Tuple, Dict

def solve_quadratic_choose_higher(B: float, V: float, A: float, F: float) -> Optional[float]:
    """
    Solve B*Q^2 + (V - A)*Q + F = 0.
    If two real roots, return the higher root.
    If one real root (discriminant == 0), return that root.
    If no real roots, return None.
    """
    a = B
    b = V - A
    c = F

    if abs(a) < 1e-12:
        # Degenerate: linear equation b*Q + c = 0 -> Q = -c/b
        if abs(b) < 1e-12:
            return None
        return -c / b

    disc = b*b - 4*a*c
    if disc < 0:
        return None
    elif abs(disc) < 1e-12:
        q = -b / (2*a)
        return q
    else:
        sqrt_disc = math.sqrt(disc)
        q1 = (-b + sqrt_disc) / (2*a)
        q2 = (-b - sqrt_disc) / (2*a)
        return max(q1, q2)

def adjusted_marginal_cost_pricing(A: float, B: float, V: float, F: float) -> Tuple[float, float, str]:
    """
    Fallback subroutine for 'adjusted marginal cost pricing' when the quadratic has no real roots.
    We'll use the MR=MC solution with MC = V (i.e., constant MC) as a pragmatic adjusted-MC fallback:
        Q_adj = (A - V) / (2B)
    Then clip to feasible range [0, A/B] because demand price becomes <= 0 after Q > A/B.
    Returns: (Q_adj, price_at_Q_adj, note)
    """
    if B <= 0:
        # If B <= 0 (nonstandard demand), fallback to zero quantity
        return 0.0, A, "B <= 0 (nonstandard); returned Q=0, price=A"

    q_candidate = (A - V) / (2 * B)
    # enforce nonnegativity and demand-feasible upper bound (price >= 0)
    q_candidate = max(q_candidate, 0.0)
    q_max = A / B if B > 0 else q_candidate
    q_candidate = min(q_candidate, q_max)

    price = A - B * q_candidate
    return q_candidate, price, "Adjusted-MC fallback using MR=MC with MC=V"

#Nondiagnostic version: only returns price and quantity
def avg_cost(A: float, B: float, V: float, F: float) -> Tuple[float, float]:
    q_root = solve_quadratic_choose_higher(B, V, A, F)
    #if result is infeasible, run adjusted MC fallback
    if q_root is not None: #real solution
        if q_root <= 0: # nonpositive = infeasible
            q_root = None
        else:
            # clip to demand-feasible max (price nonnegative)
            q_max = A / B if B > 0 else q_root
            if q_root > q_max:
                # root beyond demand support -> infeasible
                q_root = None
            else:
                # valid root
                Q = q_root
                P = A - B * Q
                return P,Q
    q_adj, p_adj, note = adjusted_marginal_cost_pricing(A, B, V, F)

    if q_adj <= 0:
        # If fallback yields zero quantity, average cost is not defined (division by 0).
        return A,0.0    # demand price at Q=0 is A

    return p_adj,q_adj

#Diagnostic version: returns dict with details
def avg_cost_DIAGNOSTIC(A: float, B: float, V: float, F: float) -> Dict[str, Optional[float]]:
    """
    Main function:
    Inputs:
      - A: demand intercept (price when Q=0)
      - B: demand slope (P = A - B Q), assumed B > 0
      - V: variable cost per unit (linear TC = F + V Q)
      - F: fixed cost

    Returns a dict containing:
      - 'Q_suggested': suggested quantity (float or None)
      - 'Price_suggested': suggested price P = A - B*Q (float or None)
      - 'Average_cost': TC/Q = (F + VQ)/Q (float or None)
      - 'method': explanation string
      - 'notes': extra info
    """
    result = {
        "Q_suggested": None,
        "Price_suggested": None,
        "Average_cost": None,
        "method": None,
        "notes": None
    }

    # 1) Try solving the quadratic
    q_root = solve_quadratic_choose_higher(B, V, A, F)
    if q_root is not None:
        # We found a real solution; ensure it's feasible (nonnegative and within demand-support)
        if q_root <= 0:
            # if nonpositive, treat as infeasible and fall back to adjusted MC fallback
            q_root = None
            method_note = "Quadratic root <= 0 (infeasible); using adjusted MC fallback."
        else:
            # clip to demand-feasible max (price nonnegative)
            q_max = A / B if B > 0 else q_root
            if q_root > q_max:
                # root beyond demand support -> infeasible
                q_root = None
                method_note = "Quadratic root > A/B (price would be negative); using adjusted MC fallback."
            else:
                # valid root
                Q = q_root
                P = A - B * Q
                TC = F + V * Q
                avg_cost = TC / Q if Q > 0 else None
                result.update({
                    "Q_suggested": Q,
                    "Price_suggested": P,
                    "Average_cost": avg_cost,
                    "method": "Solved quadratic B Q^2 + (V-A)Q + F = 0; chose higher real root",
                    "notes": f"Quadratic discriminant >= 0; root used = {Q:.6f}"
                })
                return result
    else:
        method_note = "Quadratic has no real roots; running adjusted MC fallback."

    # 2) If we reached here, run adjusted marginal cost pricing fallback
    q_adj, p_adj, note = adjusted_marginal_cost_pricing(A, B, V, F)

    if q_adj <= 0:
        # If fallback yields zero quantity, average cost is not defined (division by 0).
        result.update({
            "Q_suggested": 0.0,
            "Price_suggested": A,  # demand price at Q=0 is A
            "Average_cost": None,
            "method": "Adjusted-MC fallback produced Q=0",
            "notes": note + " (Q=0 => average cost undefined)"
        })
        return result

    TC = F + V * q_adj
    avg_cost = TC / q_adj if q_adj > 0 else None
    result.update({
        "Q_suggested": q_adj,
        "Price_suggested": p_adj,
        "Average_cost": avg_cost,
        "method": "Adjusted-MC fallback (MR=MC with MC=V)",
        "notes": note
    })
    return result
"""
# Example usage
if __name__ == "__main__":
    # Example parameters
    A = 100.0  # demand intercept
    B = 1.0    # demand slope
    V = 20.0   # variable cost per unit
    F = 100.0  # fixed cost

    out = compute_avg_cost_and_suggested_quantity(A, B, V, F)
    for k, v in out.items():
        print(f"{k}: {v}")
"""
#Nondiagnostic version: only returns price and quantity
def linear_profit_max(A, B, m, n, Q_max=None) -> Tuple[float, float]:
    denom = 2*B + n
    if denom == 0:
        raise ValueError("Denominator 2B + n is zero — examine boundaries.")
    Q_star = (A - m) / denom
    Q_feas = max(Q_star, 0.0)
    if Q_max is not None:
        Q_feas = min(Q_feas, Q_max)

    P_at_Q = A - B * Q_feas
    return P_at_Q,Q_feas
#Diagnostic version: returns dict with details
def linear_profit_max_DIAGNOSTIC(A, B, m, n, Q_max=None) -> Dict[str, Optional[float]]:
    """
    A: demand intercept (P at Q=0)
    B: demand slope (P = A - B Q), B > 0
    m: MC intercept (MC = m + n Q)
    n: MC slope
    Q_max: optional upper bound on feasible Q (e.g., inventory). None => no upper bound.
    Returns: dict with candidate Q*, feasible Q_opt, price, and diagnostics.
    """
    denom = 2*B + n
    result = {"A": A, "B": B, "m": m, "n": n}
    if denom == 0:
        result.update({"error": "Denominator 2B + n is zero — examine boundaries."})
        return result

    Q_star = (A - m) / denom
    # second-order check: require 2B + n > 0 for maximum
    soc_is_max = denom > 0

    # enforce feasibility: nonnegativity and optional upper bound
    Q_feas = max(Q_star, 0.0)
    if Q_max is not None:
        Q_feas = min(Q_feas, Q_max)

    P_at_Q = A - B * Q_feas
    MR_at_Q = A - 2*B * Q_feas
    MC_at_Q = m + n * Q_feas
    TR = A * Q_feas - B * Q_feas**2
    # total cost depends on your TC model; here we do not assume an explicit TC.
    result.update({
        "Q_candidate": Q_star,
        "Q_optimal_feasible": Q_feas,  #important
        "second_order_is_max": soc_is_max,
        "P_at_Q": P_at_Q,  #important
        "MR_at_Q": MR_at_Q,
        "MC_at_Q": MC_at_Q,
        "TR": TR,
        "MR_minus_MC": MR_at_Q - MC_at_Q
    })
    return result