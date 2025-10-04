import pytest
from engine.core.model import EconomyModel

# Define the different numbers of agents you want to test
AGENT_COUNTS = [100, 1000, 10000, 100000, 1000000]


@pytest.mark.parametrize("num_agents", AGENT_COUNTS)
def test_model_step_performance(benchmark, demographics, policies, num_agents):
    """
    Benchmarks the performance of a single model.step() call
    with a varying number of agents.
    """

    model = EconomyModel(
        num_people=num_agents, demographics=demographics, starting_policies=policies
    )

    # Benchmark: Pass the function to be timed to the benchmark fixture.
    # pytest-benchmark will call model.step() many times and record the timings.
    benchmark(model.step)
