import pytest
from pytest import mark, approx
import numpy as np
from contextlib import nullcontext
from engine.core.model import EconomyModel
from engine.types.industry_type import IndustryType
from engine.types.demographic import Demographic
from engine.agents.industry import IndustryAgent
from engine.agents.person import PersonAgent
from engine.core.indicators import calculate_unemployment


@mark.parametrize(
    "delete_values,exception",
    [
        pytest.param(False, nullcontext(), id="valid_policies"),
        pytest.param(True, pytest.raises(ValueError), id="invalid_policies"),
    ],
)
def test_validate_schema(model: EconomyModel, policies, delete_values: bool, exception):
    """
    Test for `validate_schema`.
    Tests whether a it can validate a correct schema and invalidate an invalid schema.

    Args:
       controller (ModelController): the controller being used.
        policies (dict): a valid policies.
        delete_values (bool): whether to delete values from policies
        exception: the exception expected to occur.
    """
    # TODO: add parameters for doing this with demographics as well.
    new_policies = policies.copy()
    if delete_values:
        del new_policies["corporate_income_tax"]
    with exception:
        model.validate_schema(new_policies)


@pytest.mark.parametrize(
    "mean, std",
    [
        (100, 10),  # Low variance
        (5000, 1500),  # High variance
        (800, 300),  # Medium variance
    ],
)
def test_generate_lognormal_statistics(model: EconomyModel, mean, std):
    """
    Tests that the generated distribution has approximately the
    mean and standard deviation that were requested.

    This is a stochastic test, so it uses a large sample size
    and pytest.approx for assertions.
    """
    size = 1_000_000  # Large sample size for statistical accuracy
    results = model.generate_lognormal(mean, std, size)

    # Check that the actual mean and std are close to the desired values
    # We use a relative tolerance of 1% (rel=0.01)
    assert np.mean(results) == pytest.approx(mean, rel=0.01)
    assert np.std(results) == pytest.approx(std, rel=0.01)


def test_setup_person_agents(model: EconomyModel):
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
    assert len(people) == 100  # Default in conftest.py model fixture

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

    # Using default proportions from conftest.py
    assert len(lower_class_agents) == int(0.45 * 100)
    assert len(middle_class_agents) == int(0.40 * 100)
    assert len(upper_class_agents) == int(0.15 * 100)

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


@mark.xfail(reason="Function has not been implemented yet.")
def test_setup_industry_agents(model: EconomyModel):
    assert False


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


@mark.xfail(reason="Testing for the step function has not been considered quite yet.")
def test_step(model: EconomyModel):
    assert False


@mark.xfail(reason="Function has not been implemented yet.")
def test_reverse_step(model: EconomyModel):
    assert False


@pytest.mark.parametrize(
    "unemployment_rate, market_wage, min_wage, expected_new_wage",
    [
        (0.80, 20.0, 15.0, 18.50),  # High unemployment -> wage decreases
        # (0.05 - 0.80) * 0.1 = -0.075 -> 20 * (1 - 0.075) = 18.5
        (0.02, 20.0, 15.0, 20.06),  # Low unemployment -> wage increases
        # (0.05 - 0.02) * 0.1 = 0.003 -> 20 * (1 + 0.003) = 20.06
        (1.00, 16.0, 15.0, 15.0),  # High unemployment, but hits min wage floor
        # (0.05 - 1.00) * 0.1 = -0.095 -> 16 * (1 - 0.095) = 14.48 -> max(14.48, 15.0) = 15.0
        (0.05, 20.0, 15.0, 20.0),  # At target unemployment -> no change
        # (0.05 - 0.05) * 0.1 = 0.0
    ],
)
def test_update_market_wage(
    model: EconomyModel,
    unemployment_rate,
    market_wage,
    min_wage,
    expected_new_wage,
    monkeypatch,
):
    """
    Tests the new update_market_wage function in the model.

    We monkeypatch `calculate_unemployment` to isolate the
    wage-setting logic.
    """
    # Force the model to believe the desired unemployment rate
    monkeypatch.setattr(
        "engine.core.model.calculate_unemployment", lambda m: unemployment_rate
    )

    # Set initial model state
    model.market_wage = market_wage
    model.policies["minimum_wage"] = min_wage

    # Run the function
    model.update_market_wage()

    assert model.market_wage == pytest.approx(expected_new_wage)
