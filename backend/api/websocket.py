from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from typing import Callable

from .dependencies import get_controller

# This router will be included in the main FastAPI app
router = APIRouter()

controller = get_controller()


def handle_step(model_id: int) -> dict:
    controller.step_model(model_id)
    return {"status": "success", "action": "step"}


def handle_reverse_step(model_id: int) -> dict:
    controller.step_model(model_id, time=-1)
    return {"status": "success", "action": "reverse_step"}


def handle_get_current_week(model_id: int) -> dict:
    return {
        "status": "success",
        "action": "get_current_week",
        "data": {"week": controller.get_current_week(model_id)},
    }


def handle_get_indicators(model_id: int) -> dict:
    indicators_df = controller.get_indicators(model_id)
    indicators_json = json.loads(indicators_df.to_json(orient="columns"))
    return {
        "status": "success",
        "action": "get_indicators",
        "data": indicators_json,
    }


def handle_get_policies(model_id: int) -> dict:
    policies = controller.get_policies(model_id)
    return {
        "status": "success",
        "action": "get_policies",
        "data": policies,
    }


def handle_set_policies(model_id: int, policies: dict) -> dict:
    if policies == None:
        raise ValueError("Policies cannot be None.")
    controller.set_policies(model_id, policies)
    return {
        "status": "success",
        "action": "set_policies",
    }


ACTION_HANDLERS: dict[str, Callable] = {
    "step": handle_step,
    "reverse_step": handle_reverse_step,
    "get_current_week": handle_get_current_week,
    "get_indicators": handle_get_indicators,
    "get_policies": handle_get_policies,
    "set_policies": handle_set_policies,
}


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

        while True:
            try:
                data = await websocket.receive_json()
                action = data.get("action")

                handler = ACTION_HANDLERS.get(action)
                if handler:
                    if action == "set_policies":
                        response = handler(model_id, data.get("data"))
                    else:
                        response = handler(model_id)
                else:
                    response = {"status": "error", "message": f"Unknown action: {action}"}
                await websocket.send_json(response)

            except ValueError as e:
                # Catch errors from handlers (e.g., bad policy data) and report them
                # without disconnecting the client.
                await websocket.send_json({"status": "error", "message": str(e)})
            except WebSocketDisconnect:
                print(f"Client for model {model_id} disconnected.")
                break

    except ValueError:  # Catches if model_id is not found
        await websocket.send_json({"error": f"Model with id {model_id} not found."})
        await websocket.close()
