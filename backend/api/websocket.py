from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json

from .dependencies import get_controller

# This router will be included in the main FastAPI app
router = APIRouter()

controller = get_controller()


@router.websocket("/models/{model_id}")
async def model_websocket(websocket: WebSocket, model_id: int):
    """
    Sets up a websocket for consistent communication.
    Accepts JSON messages with an "action" and optional "payload".

    Actions:
    - {"action": "step"}: Steps the model by one week.
    - {"action": "reverse_step"}: Steps the model backwards by one week.
    - {"action": "get_current_week"}: Returns the current week.}
    - {"action": "get_indicators"}: Returns all model indicators.
    - {"action": "get_policies"}: Returns the current model policies.
    - {"action": "set_policies", "payload": {...}}: Sets the model policies.

    Args:
        websocket (WebSocket): the websocket.
        model_id (int): the model to interact with.
    """

    await websocket.accept()
    try:
        # Ensure the model exists before entering the loop
        controller.get_model(model_id)

        try:
            while True:
                data = await websocket.receive_json()
                action = data.get("action")

                if action == "step":
                    controller.step_model(model_id)
                    await websocket.send_json({"status": "success", "action": "step"})
                elif action == "reverse_step":
                    controller.step_model(model_id, time=-1)
                    await websocket.send_json(
                        {"status": "success", "action": "reverse_step"}
                    )
                elif action == "get_current_week":
                    await websocket.send_json(
                        {
                            "status": "success",
                            "action": "get_current_week",
                            "data": {"week": controller.get_current_week(model_id)},
                        }
                    )
                elif action == "get_indicators":
                    indicators_df = controller.get_indicators(model_id)
                    indicators_json = json.loads(indicators_df.to_json(orient="columns"))
                    await websocket.send_json(
                        {
                            "status": "success",
                            "action": "get_indicators",
                            "data": indicators_json,
                        }
                    )
                elif action == "get_policies":
                    policies = controller.get_policies(model_id)
                    await websocket.send_json(
                        {"status": "success", "action": "get_policies", "data": policies}
                    )
                elif action == "set_policies":
                    payload = data.get("data")
                    if payload:
                        controller.set_policies(model_id, payload)
                        await websocket.send_json(
                            {"status": "success", "action": "set_policies"}
                        )
                else:
                    await websocket.send_json(
                        {"status": "error", "message": f"Unknown action: {action}"}
                    )
        except WebSocketDisconnect:
            print(f"Client for model {model_id} disconnected.")

    except ValueError:  # Catches if model_id is not found
        await websocket.send_json({"error": f"Model with id {model_id} not found."})
    finally:
        await websocket.close()
