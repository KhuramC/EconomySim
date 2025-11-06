import math
from typing import Optional

def solve_quadratic_choose_higher(B: float, V: float, A: float, F: float) -> Optional[float]:
    """
        Description:
        Helper funtion for avg_cost, performing the quadratic calculations. Full explanation in avg_cost.
    
        Solve B*Q^2 + (V - A)*Q + F = 0
        Q = [ -(V-A) += sqrt( (V-A)^2) - 4(B*F) ) ] / ( 2 * B )
        If two real roots, return the higher root, unless we don't have the inventory, then choose lower.
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
    if disc < 0:    #imaginary roots, disregard
        return None
    elif abs(disc) < 1e-12: #value under sqrt is zero -> one real root
        q = -b / (2*a)
        return q
    else:    #two real roots
        sqrt_disc = math.sqrt(disc)
        q1 = (-b + sqrt_disc) / (2*a)
        q2 = (-b - sqrt_disc) / (2*a)
        return max(q1, q2)


#Nondiagnostic version: only returns price and quantity
def avg_cost(A: float, B: float, V: float, F: float) -> Optional[int]:
    """  
        -Returns a suggested quantity of goods to produce and sell for this tick, assuming the demand graph is linear.
        -Returned quantity will set generated revenue equal to production cost (Net Profit = 0), as long as all units are sold
        -Returned quantity is rounded to the nearest whole number, so there is some margin of error that may result in 
        less than perfect results
        
        Equation for calculation:
        B*Q^2 + (V - A)*Q + F = 0
        Applying Quadratic Equation = 
        Q = [ -(V-A) +- sqrt( (V-A)^2) - 4(B*F) ) ] / ( 2 * B )
        If two real roots, return higher root to incentivise more sales.
        If one real root, return.
        If no real roots, apply linear_profit_max fallback to get production level with least amount of profit loss.
        Args:  
            A (float): Intercept of the Demand Graph (price at quantity zero)
            B (float): Slope of the Demand Graph 
            V (float): Variable cost per unit
            F (float): Fixed cost
            Q_Max: this is the maximum production quantity that the Industry is capable of producing
        Returns:  
            Q_Rounded (float): Calculated Quantity, rounded to nearest whole number
    """
    unrounded_q = 0.0
    q_root = solve_quadratic_choose_higher(B, V, A, F)
    #if result is infeasible, run adjusted linear profit fallback
    if q_root is not None: #real solution
        if q_root <= 0: # nonpositive = infeasible
            q_root = None
        else:
            # clip to demand-feasible max (price nonnegative)
            q_demand_max = A / B if B > 0 else q_root
            if q_root > q_demand_max:
                # root beyond demand support -> infeasible
                q_root = None
        unrounded_q = q_root
    else:
        #if there are no real roots, there are no profitable production levels
        #instead, minimize loss via linear profit max equation with Marginal Cost = V    
        q_adj = linear_profit_max(A, B, V, 0)

        if q_adj <= 0:
            # If fallback yields zero quantity, average cost is not defined (division by 0).
            q_adj = 0
        unrounded_q = q_adj
        
        
    if unrounded_q is not None:
        return round(unrounded_q)
    else:
        return None

#Nondiagnostic version: only returns price and quantity
def linear_profit_max(A, B, m, n) -> int:
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
    denom = 2*B + n
    if denom == 0:
        raise ValueError("Denominator 2B + n is zero — examine boundaries.")
    Q_star = (A - m) / denom
    Q_feas = max(Q_star, 0.0)
    Q_Rounded = round(Q_feas)
    return Q_Rounded

def linear_price(A,B,Q) -> float:
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
    Price_Rounded = round(P_at_Q,2) #round to two decimal places
    return Price_Rounded

def quantity_from_price(A,B,P) -> int:
    """
        Finds Quantity from price quation
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
        return int(Q_at_P)  #clamp to whole number
    