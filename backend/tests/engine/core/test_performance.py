import pytest
from engine.core.model import EconomyModel

AGENT_COUNTS = [100, 1000, 10000, 100000, 1000000]
@pytest.mark.parametrize("num_agents", AGENT_COUNTS)
def test_model_step_performance(
    benchmark, demographics, industries, policies, num_agents: int
):
    """
    Nonfunctional tests for performance of the model.
    Tests a single step with differing numbers of agents.

    Args:
        benchmark: a fixture to benchmark(time) functions.
        demographics (dict): a valid demographics.
        industries (dict): a valid industries.
        policies (dict): a valid policies.
        num_agents (int): the number of agents to create.
    """

    model = EconomyModel(
        max_simulation_length=52,
        num_people=num_agents,
        demographics=demographics,
        industries=industries,
        starting_policies=policies,
    )

    # pytest-benchmark will call model.step() many times and record the timings
    benchmark(model.step)
