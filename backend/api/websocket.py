from fastapi import WebSocket, WebSocketDisconnect
from typing import Callable
import logging

from .dependencies import get_controller, get_router

router = get_router()
controller = get_controller()

logger = logging.getLogger("WebSocket")


def handle_step(model_id: int) -> dict:
    """
    Steps through the model once.
    """
    logger.info(f"Stepping through model {model_id}.")
    controller.step_model(model_id)
    return {"status": "success", "action": "step"}


def handle_reverse_step(model_id: int) -> dict:
    """
    Reverse steps through the model once.
    """
    logger.info(f"Reverse stepping through model {model_id}.")
    controller.step_model(model_id, time=-1)
    return {"status": "success", "action": "reverse_step"}


def handle_get_current_week(model_id: int) -> dict:
    """
    Returns the current week.
    """
    current_week = controller.get_current_week(model_id)
    logger.info(f"Retrieving current week({current_week}) for model {model_id}.")
    return {
        "status": "success",
        "action": "get_current_week",
        "data": {"week": current_week},
    }


def handle_get_industry_data(model_id: int) -> dict:
    """
    Creates a dictionary of each industry variable across the whole simulation to be able to plot easily.
    """
    logger.info(f"Retrieving industry data for model {model_id}.")
    industries_df = controller.get_industry_data(model_id)
    industries_df = industries_df[industries_df["week"] > 0]

    industries_dict = {}
    # make each industries its own column, with the other stuff being the value as a dict.
    for industry_name, group in industries_df.groupby("industry"):
        industries_dict[str(industry_name)] = group.drop(columns=["industry"]).to_dict(
            orient="list"
        )
    return {
        "status": "success",
        "action": "get_industry_data",
        "data": industries_dict,
    }


def handle_get_current_industry_data(model_id: int) -> dict:
    """
    Creates a dictionary of the latest industry variables for each industry.
    """
    logger.info(f"Retrieving current industry data for model {model_id}.")
    current_week = controller.get_current_week(model_id)
    # Get data only for the current week
    industries_df = controller.get_industry_data(
        model_id, start_time=current_week, end_time=current_week
    )

    industries_dict = {}
    # make each industries its own column, with the other stuff being the value as a dict.
    for industry_name, group in industries_df.groupby("industry"):
        industries_dict[str(industry_name)] = group.drop(columns=["industry"]).to_dict(
            orient="list"
        )

    current_data = {}
    for industry, data in industries_dict.items():
        # Extract the last (and only) value for each metric
        current_data[industry] = {
            metric: values[0] for metric, values in data.items() if metric != "week"
        }

    return {
        "status": "success",
        "action": "get_current_industry_data",
        "data": current_data,
    }


def handle_get_demo_metrics(model_id: int) -> dict:
    """
    Creates a dictionary of each demographic metric across the whole simulation to be able to plot easily.
    """
    logger.info(f"Retrieving demographic metrics for model {model_id}.")
    metrics_df = controller.get_demo_metrics(model_id)
    metrics_df = metrics_df[metrics_df["week"] > 0]

    metrics_dict = {}
    # make each demographics its own column, with the other stuff being the value as a dict.
    for demo_name, group in metrics_df.groupby("Demographics"):
        metrics_dict[str(demo_name)] = group.drop(columns=["Demographics"]).to_dict(
            orient="list"
        )
    return {
        "status": "success",
        "action": "get_demo_metrics",
        "data": metrics_dict,
    }


def handle_get_current_demo_metrics(model_id: int) -> dict:
    """
    Creates a dictionary of the latest demographic metrics for each industry.
    """
    logger.info(f"Retrieving current demographic metrics for model {model_id}.")

    current_week = controller.get_current_week(model_id)
    # Get data only for the current week
    metrics_df = controller.get_demo_metrics(
        model_id, start_time=current_week, end_time=current_week
    )

    metrics_dict = {}
    # make each demographic its own column, with the other stuff being the value as a dict.
    for demo_name, group in metrics_df.groupby("Demographics"):
        metrics_dict[str(demo_name)] = group.drop(columns=["Demographics"]).to_dict(
            orient="list"
        )

    current_data = {}
    for demographic, data in metrics_dict.items():
        # Extract the last (and only) value for each metric
        current_data[demographic] = {
            metric: values[0] for metric, values in data.items() if metric != "week"
        }

    return {
        "status": "success",
        "action": "get_current_demo_metrics",
        "data": current_data,
    }


def handle_get_indicators(model_id: int) -> dict:
    """
    Creates a dictionary of each indicator across the whole simulation to be able to plot easily.
    """
    logger.info(f"Retrieving indicators for model {model_id}.")
    indicators_df = controller.get_indicators(model_id)
    indicators_df = indicators_df[indicators_df["week"] > 0]
    return {
        "status": "success",
        "action": "get_indicators",
        "data": indicators_df.to_dict(orient="list"),
    }


def handle_get_policies(model_id: int) -> dict:
    """
    Returns the policies associated with the model.
    """
    logger.info(f"Retrieving policies for model {model_id}.")
    policies = controller.get_policies(model_id)
    return {
        "status": "success",
        "action": "get_policies",
        "data": policies,
    }


def handle_set_policies(model_id: int, policies: dict) -> dict:
    """
    Sets the policies associated with the model.
    """
    if policies == None:
        raise ValueError("Policies cannot be None.")
    logger.info(f"Setting policies for model {model_id}.")
    controller.set_policies(model_id, policies)
    return {
        "status": "success",
        "action": "set_policies",
    }


ACTION_HANDLERS: dict[str, Callable] = {
    "step": handle_step,
    "reverse_step": handle_reverse_step,
    "get_current_week": handle_get_current_week,
    "get_industry_data": handle_get_industry_data,
    "get_current_industry_data": handle_get_current_industry_data,
    "get_demo_metrics": handle_get_demo_metrics,
    "get_current_demo_metrics": handle_get_current_demo_metrics,
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
    - {"action": "get_industry_data"}: Returns all industries' information.
    - {"action": "get_current_industry_data"}: Returns the current week's industries' information.
    - {"action": "get_demo_metrics"}: Returns all demographics' metrics.
    - {"action": "get_current_demo_metrics"}: Returns the current week's demographics' metrics.
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
                    logger.error(f"Unknown action: {action} selected.")
                    response = {
                        "status": "error",
                        "message": f"Unknown action: {action}",
                    }
                await websocket.send_json(response)

            except ValueError as e:
                # Catch errors from handlers (e.g., bad policy data) and report them
                # without disconnecting the client.
                logger.error(str(e))
                await websocket.send_json({"status": "error", "message": str(e)})
            except WebSocketDisconnect:
                logger.info(f"Client for model {model_id} disconnected.")
                break

    except ValueError:  # Catches if model_id is not found
        logger.error(f"Model with id {model_id} not found. WebSocket will be closed...")
        await websocket.send_json({"error": f"Model with id {model_id} not found."})
        await websocket.close()
