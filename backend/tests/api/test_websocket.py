from fastapi.testclient import TestClient

from engine.types.indicators import Indicators


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
        assert isinstance(indicators_data, dict)
        for indicator_name, indicator_data in indicators_data.items():
            # although week is in the data, it's not an indicator
            if indicator_name != "week":
                assert indicator_name in Indicators.values()
            assert len(indicator_data) == 1
