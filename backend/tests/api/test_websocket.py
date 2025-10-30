from fastapi.testclient import TestClient
import copy
import pytest
from engine.types.indicators import Indicators


def test_websocket_invalid_model(api_client: TestClient):
    """
    Tests that the websocket returns an error when connecting to a non-existent model.
    """
    with api_client.websocket_connect("/models/999") as websocket:
        response = websocket.receive_json()
        assert response == {"error": "Model with id 999 not found."}


def test_websocket_unknown_action(api_client: TestClient, created_model: int):
    """
    Tests that the websocket returns an error for an unknown action.
    """
    with api_client.websocket_connect(f"/models/{created_model}") as websocket:
        websocket.send_json({"action": "invalid_action"})
        response = websocket.receive_json()
        assert response == {
            "status": "error",
            "message": "Unknown action: invalid_action",
        }


@pytest.mark.xfail(reason="reverse_step is not implemented yet")
def test_websocket_step_and_get_week(api_client: TestClient, created_model: int):
    """
    Tests the 'step', 'reverse_step', and 'get_current_week' actions.
    """
    with api_client.websocket_connect(f"/models/{created_model}") as websocket:
        # Check initial week
        websocket.send_json({"action": "get_current_week"})
        response = websocket.receive_json()
        assert response["status"] == "success"
        assert response["data"]["week"] == 0

        # Step forward
        websocket.send_json({"action": "step"})
        response = websocket.receive_json()
        assert response == {"status": "success", "action": "step"}

        # Check week is now 1
        websocket.send_json({"action": "get_current_week"})
        response = websocket.receive_json()
        assert response["status"] == "success"
        assert response["data"]["week"] == 1

        # Step backward
        websocket.send_json({"action": "reverse_step"})
        response = websocket.receive_json()
        assert response == {"status": "success", "action": "reverse_step"}

        # Check week is back to 0
        websocket.send_json({"action": "get_current_week"})
        response = websocket.receive_json()
        assert response["status"] == "success"
        assert response["data"]["week"] == 0


def test_websocket_get_indicators(api_client: TestClient, created_model: int):
    """
    Tests the 'get_indicators' action.
    """
    with api_client.websocket_connect(f"/models/{created_model}") as websocket:
        # Step once to generate indicators for week 1
        websocket.send_json({"action": "step"})
        websocket.receive_json()  # Consume the 'step' response

        # Get indicators
        websocket.send_json({"action": "get_indicators"})
        response = websocket.receive_json()

        assert response["status"] == "success"
        assert response["action"] == "get_indicators"
        assert "data" in response

        indicators_data = response["data"]
        assert isinstance(indicators_data, dict)
        for indicator_name, indicator_data in indicators_data.items():
            if indicator_name != "week":
                assert indicator_name in Indicators.values()
            assert len(indicator_data) == 1


def test_websocket_get_industry_data(
    api_client: TestClient, created_model: int, valid_config: dict
):
    """
    Tests the 'get_industry_data' action.
    """
    with api_client.websocket_connect(f"/models/{created_model}") as websocket:
        # Step once to generate data for week 1
        websocket.send_json({"action": "step"})
        websocket.receive_json()  # Consume the 'step' response

        # Get industry data
        websocket.send_json({"action": "get_industry_data"})
        response = websocket.receive_json()

        assert response["status"] == "success"
        assert response["action"] == "get_industry_data"
        assert "data" in response

        industry_data = response["data"]
        assert isinstance(industry_data, dict)

        # Check that the data has the correct structure and length
        expected_columns = {"week", "price", "inventory", "money", "wage", "industry"}
        assert set(industry_data.keys()) == expected_columns
        num_industries = len(valid_config["industries"])
        assert len(industry_data["week"]) == num_industries


def test_websocket_get_and_set_policies(
    api_client: TestClient, created_model: int, valid_config: dict
):
    """
    Tests the 'get_policies' and 'set_policies' actions.
    Args:
        api_client (TestClient): the test client to connect to the FastAPI server.
        created_model (int): the id of the model created.
        valid_config (dict): a valid configuration that the created_model used.
    """
    with api_client.websocket_connect(f"/models/{created_model}") as websocket:
        # 1. Get initial policies
        websocket.send_json({"action": "get_policies"})
        response_get = websocket.receive_json()
        assert response_get["status"] == "success"
        assert response_get["action"] == "get_policies"
        initial_policies = response_get["data"]
        assert (
            initial_policies["personal_income_tax"]
            == valid_config["policies"]["personal_income_tax"]
        )

        # 2. Set new policies
        new_policies = copy.deepcopy(initial_policies)
        new_policies["personal_income_tax"] = 0.5
        websocket.send_json({"action": "set_policies", "data": new_policies})
        response_set = websocket.receive_json()
        assert response_set == {"status": "success", "action": "set_policies"}

        # 3. Get policies again to confirm they were updated
        websocket.send_json({"action": "get_policies"})
        response_get2 = websocket.receive_json()
        updated_policies = response_get2["data"]
        assert updated_policies["personal_income_tax"] == 0.5
