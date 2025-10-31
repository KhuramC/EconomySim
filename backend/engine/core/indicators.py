import numpy as np
from ..agents.person import PersonAgent
from mesa import Model


def calculate_lorenz_curve(model: Model) -> dict[str, list[float]]:
    """
    Calculates the Lorenz Cruve at the current timestep.

    Returns:
        dict: A dictionary with two keys, 'x' and 'y', representing the
                points of the Lorenz curve for plotting. 'x' is the cumulative
                percentage of the population, and 'y' is the cumulative
                percentage of total money.
    """

    # Get all personAgents and balances
    peopleAgents = model.agents_by_type[PersonAgent]
    balances = np.array(peopleAgents.get("current_money"))

    if balances.size == 0:
        return {"x": [0, 1], "y": [0, 1]}  # Line of perfect equality.

    # Sort and calculate cumulative shares
    balances = np.sort(balances)
    total_balance = balances.sum()
    if total_balance == 0:
        return {"x": [0, 1], "y": [0, 1]}

    cumulative_balance_share = np.cumsum(balances) / total_balance

    # Calculate cumulative population share (x-axis values)
    num_agents = len(balances)
    population_share = np.arange(1, num_agents + 1) / num_agents

    # Insert the point (0, 0) into final output so curve starts at origin.
    return {
        "x": np.insert(population_share, 0, 0).tolist(),
        "y": np.insert(cumulative_balance_share, 0, 0).tolist(),
    }


def calculate_gini_coefficient(model: Model) -> float:
    """
    Calculates the Gini coefficient for a list of balances.

    Returns:
        The Gini coefficient as a float between 0 and 1.
    """
    peopleAgents = model.agents_by_type[PersonAgent]
    balances = np.array(peopleAgents.get("current_money"))

    if len(balances) == 0:
        return 0.0

    balances = np.sort(balances)
    cumulative_balances = np.cumsum(balances)

    lorenz_area = (cumulative_balances.sum() - cumulative_balances[-1] / 2) / len(
        balances
    )
    equality_area = cumulative_balances[-1] / 2

    if equality_area == 0:
        return 0.0

    gini = (equality_area - lorenz_area) / equality_area
    return gini
