from fastapi.testclient import TestClient
from engine.types.demographic import Demographic
import json
# === Basic Endpoint Tests ===


def test_get_city_template_success(client: TestClient):
    """
    Reasoning: Tests the happy path for retrieving a valid city template.
    Ensures the endpoint correctly fetches and returns the configuration data
    associated with the enum member.
    """
    response = client.get("/templates/small")
    assert response.status_code == 200
    config = response.json()
    assert config["num_people"] > 0  # Check that it returns a valid config dict
    print(config)
    assert "policies" in config


def test_get_city_template_not_found(client: TestClient):
    """
    Reasoning: Tests the failure case where the template name is invalid.
    This confirms that FastAPI's automatic enum validation is working and
    returns a 422 (Unprocessable Entity) error for invalid inputs.
    """
    response = client.get("/templates/nonexistent")
    assert response.status_code == 422


def test_create_model_validation_error(client: TestClient, payload: dict):
    """
    Reasoning: Tests the API's validation for the creation payload.
    By sending invalid data (num_people=0), we verify that the Pydantic
    model validation is triggered, returning a 422 error.
    """
    invalid_payload = payload.copy()
    invalid_payload["num_people"] = 0  # Invalid as per the ModelCreateRequest
    response = client.post("/models", json=invalid_payload)
    assert response.status_code == 422
    
def test_create_model_validation_error_2(client: TestClient, payload: dict):
    """
    Reasoning: Tests the API's validation for the creation payload.
    By sending invalid data (num_people=0), we verify that the model validation occurs, returning a 400 error.
    """
    invalid_payload = payload.copy()
    del invalid_payload["demographics"][Demographic.LOWER_CLASS]["unemployment_rate"]  # Invalid as per the ModelCreateRequest
    response = client.post("/models", json=invalid_payload)
    assert response.status_code == 400


def test_step_model(client: TestClient, created_model: int):
    """
    Reasoning: Tests the ability to advance a simulation. It uses the `created_model`
    fixture to get a valid model ID, calls the step endpoint, and confirms
    a successful response. Also tests that a non-existent model returns a 404.
    """
    # Happy path
    response = client.post(f"/models/{created_model}/step")
    assert response.status_code == 200
    assert response.json() == {
        "message": f"Model {created_model} advanced to the next step."
    }

    # Failure path
    response = client.post("/models/999/step")
    assert response.status_code == 404


def test_get_indicators(client: TestClient, created_model: int):
    """
    Reasoning: Tests data retrieval. It ensures that after creating a model,
    we can fetch its indicators. The test checks for a successful status and
    that the returned data is in the expected DataFrame-to-JSON format (a list of objects).
    """
    response = client.get(f"/models/{created_model}/indicators")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert "Week" in data[0]
    assert "Unemployment" in data[0]


def test_get_and_set_policies(client: TestClient, created_model: int):
    """
    Reasoning: Tests the full get/set cycle for policies. It first fetches
    the initial policies, then updates them with a POST request, and finally
    fetches them again to verify that the changes were applied correctly.
    """
    # 1. Get initial policies
    response_get1 = client.get(f"/models/{created_model}/policies")
    assert response_get1.status_code == 200
    initial_policies = response_get1.json()
    assert initial_policies["personal_income_tax"] == 0.15  # From fixture

    # 2. Set new policies
    new_policies = initial_policies.copy()
    new_policies["personal_income_tax"] = 0.5
    new_policies["property_tax"] = 0.1
    
    response_set = client.post(
        f"/models/{created_model}/set_policies", json=new_policies
    )
    assert response_set.status_code == 200

    # 3. Get policies again to verify the change
    response_get2 = client.get(f"/models/{created_model}/policies")
    assert response_get2.status_code == 200
    updated_policies = response_get2.json()
    assert updated_policies["personal_income_tax"] == 0.5
    assert updated_policies["property_tax"] == 0.1


def test_delete_model(client: TestClient, created_model: int):
    """
    Reasoning: Tests the cleanup functionality. It ensures a model can be
    successfully deleted. It then immediately tries to get the same model to
    confirm that it is gone and the API correctly returns a 404 error.
    """
    # 1. Delete the model
    response_delete = client.delete(f"/models/{created_model}")
    assert response_delete.status_code == 200
    assert response_delete.json()["message"] == f"Model {created_model} deleted."

    # 2. Verify it's gone
    response_get = client.get(f"/models/{created_model}/indicators")
    assert response_get.status_code == 404


# === WebSocket Test ===


def test_websocket_step(client: TestClient, created_model: int):
    """
    Reasoning: Tests the real-time WebSocket endpoint. It simulates a client
    connecting, sending a message to trigger a step, and receiving the updated
    data back. This ensures the asynchronous, real-time functionality works as expected.
    """
    with client.websocket_connect(f"/ws/models/{created_model}/step") as websocket:
        # Send a message to the server to trigger a step
        websocket.send_text("step")

        json_string = websocket.receive_text()

        # Manually parse the JSON string into a Python list/dict
        data = json.loads(json_string)

        # Assert that the data looks correct

        assert isinstance(data, list)
        assert len(data) == 2  # Initial state + one step
        assert data[1]["Week"] == 1
