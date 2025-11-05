import pytest
from pytest import mark, approx
import numpy as np
from contextlib import nullcontext
from engine.core.model import EconomyModel
from engine.types.industry_type import IndustryType
from engine.agents.industry import IndustryAgent


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


@mark.xfail(reason="Function has not been implemented yet.")
def test_setup_person_agents(model: EconomyModel):
    assert False


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
