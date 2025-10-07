from fastapi.testclient import TestClient
from fastapi import status
from engine.types.demographic import Demographic
from engine.interface.controller import available_indicators
import json
import copy

# === Basic Endpoint Tests ===


def test_get_city_template_success(api_client: TestClient):
    """
    Reasoning: Tests the happy path for retrieving a valid city template.
    Ensures the endpoint correctly fetches and returns the configuration data
    associated with the enum member.
    """
    response = api_client.get("/templates/small")
    assert response.status_code == 200
    config = response.json()
    assert config["num_people"] > 0  # Check that it returns a valid config dict
    print(config)
    assert "policies" in config


def test_get_city_template_not_found(api_client: TestClient):
    """
    Reasoning: Tests the failure case where the template name is invalid.
    This confirms that FastAPI's automatic enum validation is working and
    returns a 422 (Unprocessable Entity) error for invalid inputs.
    """
    response = api_client.get("/templates/nonexistent")
    assert response.status_code == 422


def test_create_model_validation_error(api_client: TestClient, valid_config: dict):
    """
    Reasoning: Tests the API's validation for the creation payload.
    By sending invalid data (num_people=0), we verify that the Pydantic
    model validation is triggered, returning a 422 error.
    """
    invalid_payload = valid_config.copy()
    invalid_payload["num_people"] = 0  # Invalid as per the ModelCreateRequest
    response = api_client.post("/models/create", json=invalid_payload)
    assert response.status_code == 422


def test_create_model_validation_error_2(api_client: TestClient, valid_config: dict):
    """
    Reasoning: Tests the API's validation for the creation payload.
    By sending invalid data (num_people=0), we verify that the model validation occurs, returning a 400 error.
    """
    invalid_payload = copy.deepcopy(valid_config)
    del invalid_payload["demographics"][Demographic.LOWER_CLASS][
        "unemployment_rate"
    ]  # Invalid as per the ModelCreateRequest
    response = api_client.post("/models/create", json=invalid_payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_step_model(api_client: TestClient, created_model: int):
    """
    Reasoning: Tests the ability to advance a simulation. It uses the `created_model`
    fixture to get a valid model ID, calls the step endpoint, and confirms
    a successful response. Also tests that a non-existent model returns a 404.
    """
    # Happy path
    response = api_client.post(f"/models/{created_model}/step")
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Failure path
    response = api_client.post("/models/999/step")
    assert response.status_code == status.HTTP_404_NOT_FOUND


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
    


def test_get_and_set_policies(api_client: TestClient, created_model: int):
    """
    Reasoning: Tests the full get/set cycle for policies. It first fetches
    the initial policies, then updates them with a POST request, and finally
    fetches them again to verify that the changes were applied correctly.
    """
    # 1. Get initial policies
    response_get1 = api_client.get(f"/models/{created_model}/get_policies")
    assert response_get1.status_code == status.HTTP_200_OK
    initial_policies = response_get1.json()
    assert initial_policies["personal_income_tax"] == 0.15  # From fixture

    # 2. Set new policies
    new_policies = initial_policies.copy()
    new_policies["personal_income_tax"] = 0.5
    new_policies["property_tax"] = 0.1

    response_set = api_client.post(
        f"/models/{created_model}/set_policies", json=new_policies
    )
    assert response_set.status_code == status.HTTP_204_NO_CONTENT

    # 3. Get policies again to verify the change
    response_get2 = api_client.get(f"/models/{created_model}/get_policies")
    assert response_get2.status_code == status.HTTP_200_OK
    updated_policies = response_get2.json()
    assert updated_policies["personal_income_tax"] == 0.5
    assert updated_policies["property_tax"] == 0.1


# === WebSocket Test ===


def test_websocket_step(api_client: TestClient, created_model: int):
    """
    Reasoning: Tests the real-time WebSocket endpoint. It simulates a client
    connecting, sending a message to trigger a step, and receiving the updated
    data back. This ensures the asynchronous, real-time functionality works as expected.
    """
    with api_client.websocket_connect(f"models/{created_model}/websocket") as websocket:
        # Send a message to the server to trigger a step
        websocket.send_text("step")
        websocket.send_text("indicators")
        json_string = websocket.receive_text()

        # Manually parse the JSON string into a Python list/dict
        indicators = json.loads(json_string)

        # Assert that the data looks correct

        assert isinstance(indicators, list)
        assert len(indicators) == 1  # one step
        assert indicators[0]["Week"] == 1
