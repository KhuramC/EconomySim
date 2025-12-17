import numpy as np
from ..agents.person import PersonAgent
from ..agents.industry import IndustryAgent
from ..types.demographic import Demographic
from mesa import Model


def calculate_unemployment(model: Model) -> float:
    """
    Calculates the unemployment rate at the current step.

    Returns:
        percentage(float): The percentage of unemployed people in the simulation.
    """
    peopleAgents = model.agents_by_type[PersonAgent]
    unemployed = len(peopleAgents.select(lambda agent: (agent.employer is None)))
    total = len(peopleAgents)

    return unemployed / total


def calculate_gdp(model: Model) -> float:
    """
    Calculates the GDP,
    or the value of all goods produced by industries at the current step.

    Returns:
        gdp(float): The value of goods and services produced by the industries in the simulation.
    """

    industryAgents = model.agents_by_type[IndustryAgent]
    gdp = 0.0
    for industry in industryAgents:
        gdp += industry.tick_goods_produced * industry.price

    return gdp


def calculate_income_per_capita(model: Model):
    """
    Calculates the income per capita,
    or the average per step(weekly) income per person in the simulation.

    Returns:
        average_income(float): The average income per person(capita) in the simulation.
    """
    peopleAgents = model.agents_by_type[PersonAgent]
    return peopleAgents.agg("income", np.mean)


def calculate_median_income(model: Model):
    """
    Calculates the median income of people within the simulation.

    Returns:
        median_income(float): The median income of people in the simulation.
    """
    peopleAgents = model.agents_by_type[PersonAgent]
    return peopleAgents.agg("income", np.median)


def calculate_hoover_index(model: Model):
    """
    Calculates the Hoover Index,
    a measure of income inequality(ranges from 0-1),
    at the current timestep.

    Returns:
        hoover_index(float): squared income proportions from 0-1
    """
    peopleAgents = model.agents_by_type[PersonAgent]
    incomes = np.array(peopleAgents.get("income"))

    if incomes.size == 0:
        return 0.0

    total_income = incomes.sum()
    if total_income == 0:
        return 0.0

    total_people = incomes.size
    income_shares = incomes / total_income
    population_shares = 1.0 / total_people

    hoover_index = 0.5 * np.sum(np.abs(income_shares - population_shares))
    return hoover_index


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


def calculate_gini_coefficient(model: Model) -> float:
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


# Demographic Metrics


def calculate_proportion(model: Model) -> dict[Demographic, float]:
    """
    Calculates the proportion of each demographic in the simulation.

    Returns:
        dict[Demographic, float]: A dictionary of the proportion of each demographic.
    """
    peopleAgents = model.agents_by_type[PersonAgent]
    total_agents = len(peopleAgents)
    proportions = {}

    for demographic in Demographic:
        demoAgents = peopleAgents.select(lambda agent: agent.demographic == demographic)
        proportions[demographic] = (
            len(demoAgents) / total_agents if total_agents > 0 else 0
        )

    return proportions


def calculate_average_balance(model: Model) -> dict[Demographic, float]:
    """
    Calculates the average balance of each demographic in the simulation.

    Returns:
        dict[Demographic, float]: A dictionary of the average balance of each demographic.
    """
    peopleAgents = model.agents_by_type[PersonAgent]
    balances = {}

    for demographic in Demographic:
        demoAgents = peopleAgents.select(lambda agent: agent.demographic == demographic)
        if len(demoAgents) == 0:
            balances[demographic] = 0.0
        else:
            balances[demographic] = demoAgents.agg("balance", np.mean)

    return balances


def calculate_std_balance(model: Model) -> dict[Demographic, float]:
    """
    Calculates the standard deviation of the balance of each demographic in the simulation.

    Returns:
        dict[Demographic, float]: A dictionary of the standard deviation of the balance of each demographic.
    """
    peopleAgents = model.agents_by_type[PersonAgent]
    std_balances = {}

    for demographic in Demographic:
        demoAgents = peopleAgents.select(lambda agent: agent.demographic == demographic)
        if len(demoAgents) == 0:
            std_balances[demographic] = 0.0
        else:
            std_balances[demographic] = demoAgents.agg("balance", np.std)

    return std_balances


def calculate_average_wage(model: Model) -> dict[Demographic, float]:
    """
    Calculates the average wage of each demographic in the simulation.

    Returns:
        dict[Demographic, float]: A dictionary of the average wage of each demographic.
    """
    peopleAgents = model.agents_by_type[PersonAgent]
    wages = {}

    for demographic in Demographic:
        demoAgents = peopleAgents.select(lambda agent: agent.demographic == demographic)
        if len(demoAgents) == 0:
            wages[demographic] = 0.0
        else:
            wages[demographic] = demoAgents.agg("income", np.mean)

    return wages


def calculate_std_wage(model: Model) -> dict[Demographic, float]:
    """
    Calculates the standard deviation of the wage of each demographic in the simulation.

    Returns:
        dict[Demographic, float]: A dictionary of the standard deviation of the wage of each demographic.
    """
    peopleAgents = model.agents_by_type[PersonAgent]
    std_wages = {}

    for demographic in Demographic:
        demoAgents = peopleAgents.select(lambda agent: agent.demographic == demographic)
        if len(demoAgents) == 0:
            std_wages[demographic] = 0.0
        else:
            std_wages[demographic] = demoAgents.agg("income", np.std)

    return std_wages
