import pytest
from pytest import mark
from contextlib import nullcontext
from engine.types.industry_type import IndustryType
from engine.types.indicators import Indicators
from engine.interface.controller import ModelController


def test_create_model(controller: ModelController, demographics, industries, policies):
    """
    Test for `create_model`.
    Ensures that the controller is correctly making a new model.

    Args:
        controller (ModelController): the controller being used.
        demographics (dict): a valid demographics.
        industries (dict): a valid industries.
        policies (dict): a valid policies.
    """

    model_id = controller.create_model(
        max_simulation_length=52,
        num_people=100,
        demographics=demographics,
        industries=industries,
        starting_policies=policies,
    )
    assert controller.models[model_id].policies == policies
    assert controller.next_id == model_id + 1


@mark.parametrize(
    "model_id,exception",
    [
        pytest.param(1, nullcontext(1), id="valid_id"),
        pytest.param(2, pytest.raises(ValueError), id="invalid_id"),
    ],
)
def test_delete_model(
    controller: ModelController,
    demographics,
    industries,
    policies,
    model_id: int,
    exception,
):
    """
    Test for `delete_model`.
    Tests attempted deletion of a valid and invalid model id.

    Args:
        controller (ModelController): the controller being used.
        demographics (dict): a valid demographics.
        industries (dict): a valid industries.
        policies (dict): a valid policies.
        model_id (int): the id of the model to delete.
        exception: the expected exception.
    """
    controller.create_model(
        max_simulation_length=52,
        num_people=100,
        demographics=demographics,
        industries=industries,
        starting_policies=policies,
    )

    with exception:
        controller.delete_model(model_id)
        assert model_id not in controller.models


@mark.xfail(reason="Testing the step function has not been determined yet.")
def test_step_model(controller: ModelController, demographics, policies):
    assert False


# TODO: add tests for reverse stepping as well.


def test_get_policies(controller: ModelController, demographics, industries, policies):
    """
    Test for `get_policies`.
    Tests that one can correctly retrieve the current policies of a model.

    Args:
        controller (ModelController): the controller being used.
        demographics (dict): a valid demographics.
        industries (dict): a valid industries.
        policies (dict): a valid policies.
    """

    model_id = controller.create_model(
        max_simulation_length=52,
        num_people=100,
        demographics=demographics,
        industries=industries,
        starting_policies=policies,
    )
    retrieved_policies = controller.get_policies(model_id)
    assert retrieved_policies == policies


def test_set_policies(controller: ModelController, demographics, industries, policies):
    """
    Test for `set_policies`.
    Tests that one can correctly set the current policies of a model.

    Args:
        controller (ModelController): the controller being used.
        demographics (dict): a valid demographics.
        industries (dict): a valid industries.
        policies (dict): a valid policies.
    """

    model_id = controller.create_model(
        max_simulation_length=52,
        num_people=100,
        demographics=demographics,
        industries=industries,
        starting_policies=policies,
    )

    new_policies = policies.copy()
    new_policies["corporate_income_tax"][IndustryType.AUTOMOBILES] = 0.25
    controller.set_policies(model_id, new_policies)

    retrieved_policies = controller.get_policies(model_id)
    assert retrieved_policies == new_policies


def test_get_current_week(
    controller: ModelController, demographics, industries, policies
):
    """
    Test for `get_current_week`.
    Tests that one can correctly retrieve the current week of a model.
    """

    model_id = controller.create_model(
        max_simulation_length=52,
        num_people=100,
        demographics=demographics,
        industries=industries,
        starting_policies=policies,
    )
    current_week = controller.get_current_week(model_id)
    assert current_week == 0

    controller.step_model(model_id)
    current_week = controller.get_current_week(model_id)
    assert current_week == 1


@mark.parametrize(
    "kwargs, error_msg",
    [
        pytest.param(
            {"start_time": -1},
            "Invalid start_time or end_time values.",
            id="negative_start",
        ),
        pytest.param(
            {"end_time": -1},
            "Invalid start_time or end_time values.",
            id="negative_end",
        ),
        pytest.param(
            {"start_time": 3, "end_time": 2},
            "Invalid start_time or end_time values.",
            id="start_after_end",
        ),
        pytest.param(
            {"model_id": 999}, "Model with ID 999 does not exist.", id="bad_model_id"
        ),
    ],
)
def test_get_industry_data_validation(
    controller: ModelController, demographics, industries, policies, kwargs, error_msg
):
    """Tests parameter validation for `get_industry_data`."""
    model_id = controller.create_model(
        max_simulation_length=52,
        num_people=10,
        demographics=demographics,
        industries=industries,
        starting_policies=policies,
    )
    if "model_id" not in kwargs:
        kwargs["model_id"] = model_id

    with pytest.raises(ValueError, match=error_msg):
        controller.get_industry_data(**kwargs)


def test_get_industry_data(
    controller: ModelController, demographics, industries, policies
):
    """
    Test for `get_industry_data`.
    Tests that time and industry filtering function as expected and
    that the dataframe returned has the correct structure.
    """
    model_id = controller.create_model(
        max_simulation_length=52,
        num_people=10,
        demographics=demographics,
        industries=industries,
        starting_policies=policies,
    )

    # Step the model 5 times to generate data for weeks 1 through 5
    for _ in range(5):
        controller.step_model(model_id)

    # Test fetching all data (end_time=0 means up to current week, which is 5)
    all_data_df = controller.get_industry_data(model_id, start_time=0, end_time=0)
    assert not all_data_df.empty
    assert set(all_data_df["week"].unique()) == {1, 2, 3, 4, 5}
    assert len(all_data_df["industry"].unique()) == len(industries)
    expected_columns = {"week", "price", "inventory", "money", "offered_wage", "industry"}
    assert expected_columns.issubset(all_data_df.columns)

    # Test time filtering
    time_filtered_df = controller.get_industry_data(model_id, start_time=2, end_time=4)
    assert set(time_filtered_df["week"].unique()) == {2, 3, 4}

    # Test industry filtering
    target_industries = [IndustryType.GROCERIES, IndustryType.HOUSING]
    industry_filtered_df = controller.get_industry_data(
        model_id, industries=target_industries
    )
    assert set(industry_filtered_df["industry"].unique()) == set(target_industries)

    # Test filtering by both time and industry
    combined_filtered_df = controller.get_industry_data(
        model_id, start_time=3, end_time=5, industries=[IndustryType.AUTOMOBILES]
    )
    assert set(combined_filtered_df["week"].unique()) == {3, 4, 5}
    assert set(combined_filtered_df["industry"].unique()) == {IndustryType.AUTOMOBILES}


@mark.parametrize(
    "kwargs, error_msg",
    [
        pytest.param(
            {"start_time": -1},
            "Invalid start_time or end_time values.",
            id="negative_start",
        ),
        pytest.param(
            {"end_time": -1},
            "Invalid start_time or end_time values.",
            id="negative_end",
        ),
        pytest.param(
            {"start_time": 3, "end_time": 2},
            "Invalid start_time or end_time values.",
            id="start_after_end",
        ),
        pytest.param(
            {"model_id": 999}, "Model with ID 999 does not exist.", id="bad_model_id"
        ),
        pytest.param(
            {"indicators": ["not_a_real_indicator"]},
            "One or more requested indicators are not available.",
            id="bad_indicator",
        ),
    ],
)
def test_get_indicators_validation(
    controller: ModelController, demographics, industries, policies, kwargs, error_msg
):
    """Tests parameter validation for `get_indicators`."""
    model_id = controller.create_model(
        max_simulation_length=52,
        num_people=10,
        demographics=demographics,
        industries=industries,
        starting_policies=policies,
    )
    if "model_id" not in kwargs:
        kwargs["model_id"] = model_id

    with pytest.raises(ValueError, match=error_msg):
        controller.get_indicators(**kwargs)


def test_get_indicators(
    controller: ModelController, demographics, industries, policies
):
    """
    Test for `get_indicators`.
    Tests that time and indicator filtering function as expected and
    that the dataframe returned has the correct structure.
    """
    model_id = controller.create_model(
        max_simulation_length=52,
        num_people=10,
        demographics=demographics,
        industries=industries,
        starting_policies=policies,
    )

    # Step the model 5 times to generate data for weeks 1 through 5
    for _ in range(5):
        controller.step_model(model_id)

    # Test fetching all data
    all_data_df = controller.get_indicators(model_id)
    assert not all_data_df.empty
    assert set(all_data_df["week"]) == {1, 2, 3, 4, 5}
    assert set(all_data_df.columns) == set(Indicators.values()).union({"week"})

    # Test time filtering
    time_filtered_df = controller.get_indicators(model_id, start_time=2, end_time=4)
    assert set(time_filtered_df["week"]) == {2, 3, 4}

    # Test indicator filtering
    target_indicators = [Indicators.GDP, Indicators.UNEMPLOYMENT]
    indicator_filtered_df = controller.get_indicators(
        model_id, indicators=target_indicators
    )
    # The 'week' column should always be returned
    assert set(indicator_filtered_df.columns) == set(target_indicators).union({"week"})
    assert set(indicator_filtered_df["week"]) == {1, 2, 3, 4, 5}

    # Test filtering by both time and indicators
    combined_filtered_df = controller.get_indicators(
        model_id, start_time=3, end_time=5, indicators=[Indicators.GDP]
    )
    assert set(combined_filtered_df["week"]) == {3, 4, 5}
    assert set(combined_filtered_df.columns) == {Indicators.GDP, "week"}


@mark.parametrize(
    "model_id,exception",
    [
        pytest.param(1, nullcontext(1), id="valid_id"),
        pytest.param(2, pytest.raises(ValueError), id="invalid_id"),
    ],
)
def test_get_model(
    controller: ModelController,
    demographics,
    industries,
    policies,
    model_id: int,
    exception,
):
    """
    Parametrized test for `get_model`.
    Tests attempted get of a valid and invalid model id.

    Args:
        controller (ModelController): the controller being used.
        demographics (dict): a valid demographics.
        industries (dict): a valid industries.
        policies (dict): a valid policies.
        model_id (int): the id of the model to get.
        exception: the expected exception.
    """
    controller.create_model(
        max_simulation_length=52,
        num_people=100,
        demographics=demographics,
        industries=industries,
        starting_policies=policies,
    )
    with exception:
        model = controller.get_model(model_id)
        assert model is controller.models[model_id]
