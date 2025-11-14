import numpy as np
from typing import TYPE_CHECKING
import statistics
from ..agents.person import PersonAgent
from ..agents.industry import IndustryAgent


if TYPE_CHECKING:
    from .model import EconomyModel


def calculate_unemployment(model: EconomyModel) -> float:
    """
    Calculates the unemployment rate at the current step.

    Returns:
        percentage(float): The percentage of unemployed people in the simulation.
    """
    peopleAgents = model.agents_by_type[PersonAgent]
    unemployed = len(peopleAgents.select(lambda agent: (agent.employer is None)))
    total = len(peopleAgents)

    return unemployed / total


def calculate_gdp(model: EconomyModel) -> float:
    """
    Calculates the GDP,
    or the value of all goods produced by industries at the current step.

    Returns:
        gdp(float): The value of goods and services produced by the industries in the simulation.
    """

    industryAgents = model.agents_by_type[IndustryAgent]
    gdp = 0.0
    for industry in industryAgents:
        gdp += industry.goods_produced * industry.price

    return gdp


def calculate_income_per_capita(model: EconomyModel):
    """
    Calculates the income per capita,
    or the average per step(weekly) income per person in the simulation.

    Returns:
        average_income(float): The average income per person(capita) in the simulation.
    """
    peopleAgents = model.agents_by_type[PersonAgent]
    total = len(peopleAgents)
    return peopleAgents.agg(
        "income", lambda incomes: sum(incomes) / total if total > 0 else 0
    )


def calculate_median_income(model: EconomyModel):
    """
    Calculates the median income of people within the simulation.

    Returns:
        median_income(float): The median income of people in the simulation.
    """
    peopleAgents = model.agents_by_type[PersonAgent]
    return peopleAgents.agg("income", lambda incomes: statistics.median(incomes))


def calculate_hoover_index(model: EconomyModel):
    """
    Calculates the Hoover Index,
    a measure of income inequality(ranges from 0-1),
    at the current timestep.

    Returns:
        hoover_index(float): squared income proportions from 0-1
    """

    # TODO: Implement calculation of the Hoover Index
    # see https://www.wallstreetoasis.com/resources/skills/economics/hoover-index
    # for the formula. It's from the project documentation back in the spring

    return 0


def calculate_lorenz_curve(model: EconomyModel) -> dict[str, list[float]]:
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
    balances = np.array(peopleAgents.get("balance"))

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


def calculate_gini_coefficient(model: EconomyModel) -> float:
    """
    Calculates the Gini coefficient for a list of balances.

    Returns:
        The Gini coefficient as a float between 0 and 1.
    """
    peopleAgents = model.agents_by_type[PersonAgent]
    balances = np.array(peopleAgents.get("balance"))

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
