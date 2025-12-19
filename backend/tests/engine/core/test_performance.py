import pytest
from engine.core.model import EconomyModel

AGENT_COUNTS = [100, 1000, 10000, 100000, 1000000]
@pytest.mark.parametrize("num_agents", AGENT_COUNTS)
@pytest.mark.performance
def test_model_step_performance(
    benchmark, population, industries, policies, num_agents: int
):
    """
    Nonfunctional tests for performance of the model.
    Tests a single step with differing numbers of agents.

    Args:
        benchmark: a fixture to benchmark(time) functions.
        population (dict): a valid population.
        industries (dict): a valid industries.
        policies (dict): a valid policies.
        num_agents (int): the number of agents to create.
    """

    model = EconomyModel(
        max_simulation_length=52,
        num_people=num_agents,
        population=population,
        industries=industries,
        starting_policies=policies,
    )

    # pytest-benchmark will call model.step() many times and record the timings
    benchmark(model.step)
