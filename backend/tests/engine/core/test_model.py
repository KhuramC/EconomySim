import pytest
from pytest import mark, approx
import numpy as np
import copy
from contextlib import nullcontext
from engine.core.model import EconomyModel
from engine.core.utils import num_prop
from engine.types.industry_type import IndustryType
from engine.types.demographic import Demographic
from engine.agents.industry import IndustryAgent
from engine.agents.person import PersonAgent


def test_setup_person_agents(model: EconomyModel, num_agents: int, demographics):
    """
    Tests that the `setup_person_agents` method, called during
    EconomyModel.__init__, correctly creates agents.

    Tests for:
        1. Correct total number of agents.
        2. Correct proportion of agents per demographic.
        3. All expected attributes are initialized.
        4. Industry coverage: preferences should include all industries
    """
    # Test correct number of agents
    people = model.agents_by_type[PersonAgent]
    assert len(people) == num_agents

    # Test correct demographic proportions
    lower_class_agents = people.select(
        lambda agent: agent.demographic == Demographic.LOWER_CLASS
    )
    middle_class_agents = people.select(
        lambda agent: agent.demographic == Demographic.MIDDLE_CLASS
    )
    upper_class_agents = people.select(
        lambda agent: agent.demographic == Demographic.UPPER_CLASS
    )

    props = num_prop(
        [
            demographics[demographic]["proportion"] * 100
            for demographic in demographics.keys()
        ],
        num_agents,
    )
    assert len(lower_class_agents) == props[0]
    assert len(middle_class_agents) == props[1]
    assert len(upper_class_agents) == props[2]

    # Test expected attributes
    expected_keys = set([industry.value for industry in IndustryType])

    for agent in people:
        assert hasattr(agent, "preferences")
        assert isinstance(agent.preferences, dict)
        assert all(isinstance(val, float) for val in agent.preferences.values())

        assert hasattr(agent, "income")
        assert isinstance(agent.income, (int, float))
        assert agent.income >= 0

        assert hasattr(agent, "demographic")
        assert isinstance(agent.demographic, Demographic)

        # Test industry coverage
        assert set(agent.preferences.keys()) == expected_keys


def test_setup_person_agents_preferences(model: EconomyModel, demographics):
    """
    Tests that:
        1. Each PersonAgent preference vector sums to 1 (within floating tolerance).
        2. There is heterogeneity (not all preference vectors are identical).
        3. For each demographic, the empirical mean of preference vectors is consistent
           with the theoretical Dirichlet mean within expected sampling noise.
    """
    people = model.agents_by_type[PersonAgent]
    assert len(people) > 0, "No PersonAgents were created."

    industries = [industry.value for industry in IndustryType]

    # Test that preferences sum to 1.
    for agent in people:
        assert sum(agent.preferences.values()) == approx(1.0, abs=1e-8)

    # For PersonAgents in each demographic...
    for demo in Demographic:
        demo_agents = people.select(lambda agent: agent.demographic == demo)
        if len(demo_agents) <= 1:
            continue

        theoretical_means = demographics[demo]["spending_behavior"]
        theoretical_mean_vector = np.array(
            [theoretical_means[key] for key in industries]
        )

        all_pref_vectors = np.array(
            [[agent.preferences[key] for key in industries] for agent in demo_agents]
        )

        # Test heterogeneity
        unique_prefs = {tuple(np.round(v, 8)) for v in all_pref_vectors}
        assert len(unique_prefs) > 1

        # Test mean consistency statistically
        empirical_mean = all_pref_vectors.mean(axis=0)
        n = len(all_pref_vectors)

        # Approximate expected sampling noise for Dirichlet means
        # Var[X_i] = α_i(α₀ - α_i) / (α₀² (α₀ + 1))
        alphas = np.array(list(theoretical_means.values()))
        alpha0 = np.sum(alphas)
        var = alphas * (alpha0 - alphas) / (alpha0**2 * (alpha0 + 1))
        std_err = np.sqrt(var / n)

        # Check that theoretical mean lies within ~3 standard errors
        diff = np.abs(empirical_mean - theoretical_mean_vector)
        tolerance = 3 * std_err
        assert np.all(diff <= tolerance)


def test_setup_industry_agents(model: EconomyModel, industries):
    """
    Tests `setup_industry_agents`. Ensures that only one agent is created per industry
    and that they are setup with the correct starting parameters.

    Args:
        model (EconomyModel): a freshly created model.
        industries (dict): a valid industries.
    """

    industry_agents = model.agents_by_type[IndustryAgent]
    assert len(industry_agents) == len(industries)

    for industry_type, industry_info in industries.items():
        industry_agent = industry_agents.select(
            lambda agent: agent.industry_type == industry_type
        )[0]
        assert industry_agent.industry_type == industry_type
        assert industry_agent.price == industry_info["starting_price"]
        assert industry_agent.inventory == industry_info["starting_inventory"]
        assert industry_agent.balance == industry_info["starting_balance"]
        assert industry_agent.offered_wage == industry_info["starting_offered_wage"]


@pytest.mark.parametrize("industry_type", list(IndustryType))
def test_get_employees(model: EconomyModel, industry_type: IndustryType):
    """
    Test for `get_employees`.
    Ensures that each employee has employees, as currently implemented.

    Args:
        model (EconomyModel): a freshly created model.
        industry_type (IndustryType): the industry type being tested.
    """
    assert len(model.get_employees(industry_type)) == 0
    # TODO: redo this whenever starting unemployment logic changes


@pytest.mark.parametrize(
    "inflation_rate, num_steps",
    [
        (0.01, 1),  # 1.0% inflation for 1 step
        (0.0, 3),  # Zero inflation, should have no effect
        (0.025, 2),  # 2.5% inflation, but compounded over two steps
    ],
)
def test_inflation(model: EconomyModel, inflation_rate: float, num_steps: int):
    """
    Tests that the EconomyModel.inflation() method correctly increases:
    - IndustryAgent.raw_mat_cost
    - IndustryAgent.fixed_cost

    It also verifies that inflation does NOT directly change:
    - IndustryAgent.offered_wage
    """
    model.inflation_rate = inflation_rate
    industryAgents = model.agents_by_type[IndustryAgent]

    initial_costs = [
        (industry.raw_mat_cost, industry.fixed_cost) for industry in industryAgents
    ]
    initial_offered_wages = [industry.offered_wage for industry in industryAgents]

    for _ in range(num_steps):
        model.inflation()

    assert len(industryAgents) > 0  # Ensure model intact

    multiplier = (1 + inflation_rate) ** num_steps

    for i, industry in enumerate(industryAgents):
        initial_raw, initial_fixed = initial_costs[i]

        expected_raw_cost = initial_raw * multiplier
        expected_fixed_cost = initial_fixed * multiplier

        assert industry.raw_mat_cost == approx(expected_raw_cost)
        assert industry.fixed_cost == approx(expected_fixed_cost)

        assert industry.offered_wage == approx(
            initial_offered_wages[i]
        )  # No side effects


def test_step(model: EconomyModel):
    """
    Test for `step`. Ensures that the step function is working properly.

    Args:
        model (EconomyModel): _description_
    """
    model.step()
    
    assert model.get_week() == 1
    for _ in range(100):
        model.step()
    assert model.get_week() == 52 # max for this model


def test_reverse_step(model: EconomyModel):
    # TODO: test whenever reverse_step is implemented
    pass
