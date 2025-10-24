from fastapi.testclient import TestClient
from fastapi import status
import pytest
from pytest import mark
from typing import Any

from api.city_template import CityTemplate
from engine.types.demographic import Demographic
from engine.interface.controller import available_indicators
import json
import copy

template_test_params = [
    pytest.param(
        template.value,
        status.HTTP_200_OK,
        template.config,
        id=f"{template.value} template",
    )
    for template in list(CityTemplate)
]
template_test_params.append(
    pytest.param(
        "invalid", status.HTTP_422_UNPROCESSABLE_ENTITY, None, id="invalid template"
    ),
)


@mark.parametrize(
    "template,status_code,expected_config",
    template_test_params,
)
def test_get_city_template_config(
    api_client: TestClient,
    template: str,
    status_code: int,
    expected_config: dict[str, Any] | None,
):
    """
    Parametrized test for `get_city_template_config`, an API endpoint.
    Tests with all valid configs, and then with an invalid one.

    Args:
        api_client (TestClient): the test client to connect to the FastAPI server.
        template (str): the city template string.
        status_code (int): the expected return status code from calling the method.
        expected_config (dict[str, Any] | None): The expected config, or nothing if it is meant to be invalid.
    """

    response = api_client.get(f"/templates/{template}")
    assert response.status_code == status_code
    if status_code == status.HTTP_200_OK:
        config = response.json()
        assert config["num_people"] > 0  # Check that it returns a valid config dict
        assert "policies" in config
        assert config == expected_config


@mark.parametrize(
    "invalid_config,status_code",
    [
        pytest.param(
            ("num_people",), status.HTTP_422_UNPROCESSABLE_ENTITY, id="invalid payload"
        ),
        pytest.param(
            ("demographics", Demographic.LOWER_CLASS),
            status.HTTP_400_BAD_REQUEST,
            id="invalid_demographics",
        ),
        pytest.param(
            ("policies", "corporate_income_tax"),
            status.HTTP_400_BAD_REQUEST,
            id="invalid_policies",
        ),
    ],
    indirect=["invalid_config"],
)
def test_create_model_fail(
    api_client: TestClient, invalid_config: dict[str, Any], status_code: int
):
    """
    Parametrized test for `test_create_model` failing, an API endpoint.
    Tests against the ModelCreateRequest to ensure it works or against
    the validation of policies/demographics, which result in slightly different status codes.

    Args:
        api_client (TestClient): the test client to connect to the FastAPI server.
        invalid_config (dict[str, Any]): an invalid configuration for setting up a simulation.
        status_code (int): the expected return status code from calling the method.
    """

    response = api_client.post("/models/create", json=invalid_config)
    assert response.status_code == status_code


def test_get_and_set_policies(
    api_client: TestClient, created_model: int, valid_config: dict[str, Any]
):
    """
    Test for `get_model_policies` and `set_model_policies`, an API endpoint.
    Tests that it gets the correct initial parameters, and then correctly sets/changes them.

    Args:
        api_client (TestClient): the test client to connect to the FastAPI server.
        created_model (int): the id of the model created.
        valid_config (dict[str, Any]): a valid configuration that the created_model used.
    """

    # Get initial policies
    response = api_client.get(f"/models/{created_model}/policies")
    assert response.status_code == status.HTTP_200_OK
    initial_policies = response.json()
    assert (
        initial_policies["personal_income_tax"]
        == valid_config["policies"]["personal_income_tax"]
    )

    # Set new policies
    new_policies = copy.deepcopy(initial_policies)
    new_policies["personal_income_tax"] = 0.5
    new_policies["property_tax"] = 0.1

    response_set = api_client.post(
        f"/models/{created_model}/policies", json=new_policies
    )
    assert response_set.status_code == status.HTTP_204_NO_CONTENT

    # Get new policies, confirm same as what was set.
    response_get2 = api_client.get(f"/models/{created_model}/policies")
    assert response_get2.status_code == status.HTTP_200_OK
    updated_policies = response_get2.json()
    assert updated_policies["personal_income_tax"] == 0.5
    assert updated_policies["property_tax"] == 0.1


def test_get_indicators(api_client: TestClient, created_model: int):
    """
    Reasoning: Tests data retrieval. It ensures that after creating a model,
    we can fetch its indicators. The test checks for a successful status and
    that the returned data is in the expected DataFrame-to-JSON format (a list of objects).
    """
    args = {
        "start_time": 0,
        "end_time": 0,
    }

    response = api_client.post(f"/models/{created_model}/step")
    assert response.status_code == status.HTTP_204_NO_CONTENT

    response = api_client.get(f"/models/{created_model}/indicators", params=args)
    assert response.status_code == status.HTTP_200_OK

    indicators = response.json()
    assert isinstance(indicators, list)
    assert "Week" in indicators[0]
    for indicator in available_indicators:
        assert indicator in indicators[0]


def test_step_model(api_client: TestClient, created_model: int):
    """
    Test for `step_model`, an API endpoint.
    Tests return codes for stepping with a valid and invalid model id.

    Args:
        api_client (TestClient): the test client to connect to the FastAPI server.
        created_model (int): the id of the model created.
    """

    # Successful path
    response = api_client.post(f"/models/{created_model}/step")
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Failure path
    response = api_client.post("/models/999/step")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_model_websocket(api_client: TestClient, created_model: int):
    """
    Test for `step_model_websocket`, an API endpoint.
    Tests that it can connect, simulating a possible use case and works as expected.
    Args:
        api_client (TestClient): the test client to connect to the FastAPI server.
        created_model (int): the id of the model created.
    """

    with api_client.websocket_connect(f"/models/{created_model}") as websocket:
        # 1. Send a "step" action and verify the response
        websocket.send_json({"action": "step"})
        response_step = websocket.receive_json()
        assert response_step == {"status": "success", "action": "step"}

        # 2. Send a "get_indicators" action and verify the response
        websocket.send_json({"action": "get_indicators"})
        response_indicators = websocket.receive_json()

        # Assert the structure of the indicators response
        assert response_indicators["status"] == "success"
        assert response_indicators["action"] == "get_indicators"
        assert "data" in response_indicators

        # Assert the content of the indicators data
        indicators_data = response_indicators["data"]
        assert isinstance(indicators_data, list)
        assert len(indicators_data) == 1 # Week 1 (after step)
        assert indicators_data[0]["Week"] == 1
        for indicator in available_indicators:
            assert indicator in indicators_data[0]
