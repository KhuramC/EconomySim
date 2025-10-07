from fastapi import FastAPI, HTTPException, WebSocket, status
from fastapi.responses import Response
from pydantic import BaseModel, Field
import pandas as pd
from typing import Any

from engine.interface.controller import ModelController
from engine.types.industry_type import IndustryType
from engine.types.demographic import Demographic
from .city_template import CityTemplate

# these work like singletons here
controller = ModelController()
app = FastAPI()


class ModelCreateRequest(BaseModel):
    """Defines the expected structure for creating a new simulation model."""

    num_people: int = Field(..., gt=0, description="Number of person agents to create.")
    demographics: dict[
        Demographic, dict[str, float | dict[str | IndustryType, float]]
    ] = Field(..., description="Demographic distribution for the population.")
    policies: dict[str, float | dict[IndustryType, float]] = Field(
        ..., description="Policies for the simulation."
    )
    inflation_rate: float = Field(..., ge=0.0, description="Weekly inflation rate.")


# API Endpoints


@app.get("/", status_code=status.HTTP_200_OK)
async def root():
    """Sanity check for the API."""
    return {"message": "EconomySim API is running."}


@app.get("/templates/{template}", status_code=status.HTTP_200_OK)
async def get_city_template_config(template: CityTemplate) -> dict[str, Any]:
    """
    Retrieves the simulation configuration associated with the template.
    The default status code is 200 upon success.

    Args:
        template (CityTemplate): the template who's config is wanted.

    Raises:
        HTTPException(404): if the template does not exist.

    Returns:
        config (dict): A dictionary of the number of people, the demographics, the starting policies, and the inflation rate.
    """
    if template is not None:
        config = template.config
        return config
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"City Template '{template}' not found.",
        )


@app.post("/models/create", status_code=status.HTTP_201_CREATED)
async def create_model(model_parameters: ModelCreateRequest) -> int:
    """
    Creates a model based on the given parameters.

    Args:
        model_parameters (ModelCreateRequest): The parameters for the model.

    Raises:
        HTTPException(400): If the arguments passed in were invalid.

    Returns:
        model_id(int): The id associated with the created model.
    """
    try:
        model_id = controller.create_model(
            num_people=model_parameters.num_people,
            demographics=model_parameters.demographics,
            starting_policies=model_parameters.policies,
            inflation_rate=model_parameters.inflation_rate,
        )
        return model_id
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@app.get("/models/{model_id}/get_policies", status_code=status.HTTP_200_OK)
async def get_model_policies(
    model_id: int,
) -> dict[str, float | dict[IndustryType, float]]:
    """
    Returns all of the current policies associated with a model.

    Args:
        model_id (int): the id of the model.

    Raises:
        HTTPException(404): if the model was not found.

    Returns:
        policies (dict): A dictionary of all the policies associated with a model.
    """
    try:
        policies = controller.get_policies(model_id)
        return policies
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model with id {model_id} not found.",
        )


@app.post("/models/{model_id}/set_policies", status_code=status.HTTP_204_NO_CONTENT)
async def set_model_policies(
    model_id: int, policies: dict[str, float | dict[IndustryType, float]]
):
    """
    Sets all of the current policies in a model.

    Args:
        model_id (int): the id of the model.
        policies (dict[str, float  |  dict[IndustryType, float]]): the policies to update with.

    Raises:
        HTTPException(404): if the model could not be found, or the policies were not correctly formatted.
    """
    try:
        controller.set_policies(model_id, policies)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model with id {model_id} not found, or policies were not in right format.",
        )


def dataframe_to_json_response(df: pd.DataFrame) -> Response:
    """
    Converts a pandas DataFrame to JSON, handling the underlying numpy types.

    Args:
        df (DataFrame): The dataframe to convert.

    Returns:
        response (Response): A Response containing a JSON string of the dataframe.
    """

    json_string = df.to_json(orient="records")  # list of rows
    return Response(content=json_string, media_type="application/json")


@app.get("/models/{model_id}/indicators", status_code=status.HTTP_200_OK)
async def get_model_indicators(
    model_id: int,
    start_time: int,
    end_time: int,
) -> Response:
    """
    Retrieves the indicators from a model at the timeframe desired.

    Args:
        model_id (int): the id of the model desired.
        start_time (int): the starting time for the indicators
        end_time (int): the ending time for the indicators. If 0, it goes to the current time

    Raises:
        HTTPException(404): if the model does not exist.

    Returns:
        Response: A Response containing a JSON string of the dataframe on a per row basis.
    """

    try:
        indicators_df = controller.get_indicators(
            model_id, start_time, end_time, indicators=None
        )
        return dataframe_to_json_response(indicators_df)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model with id {model_id} not found.",
        )


@app.post("/models/{model_id}/step", status_code=status.HTTP_204_NO_CONTENT)
async def step_model(model_id: int):
    """
    Steps the simulation for a given model once.

    Args:
        model_id (int): the model to step.

    Raises:
        HTTPException(404): if the model does not exist.
    """
    try:
        controller.step_model(model_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model with id {model_id} not found.",
        )


@app.websocket("/models/{model_id}/websocket")
async def step_model_websocket(websocket: WebSocket, model_id: int):
    """
    Sets up a websocket for consistent communication.
    Allows for stepping with "step", and getting indicators with "indicators"

    Args:
        websocket (WebSocket): the websocket.
        model_id (int): the model to step.
    """

    await websocket.accept()
    try:
        while True:
            text = await websocket.receive_text()  # Wait for a message from the client
            if "step" in text:
                controller.step_model(model_id)
            elif "indicators" in text:
                indicators = controller.get_indicators(model_id).to_json(
                    orient="records"
                )  # manually turn into json
                await websocket.send_text(
                    indicators
                )  # Send indicators back to the client
            # TODO: fleshout websocket, like with being able to set/get policies.

    except ValueError:
        await websocket.send_json({"error": f"Model with id {model_id} not found."})
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()
        print(f"WebSocket connection closed.")


@app.delete("/models/{model_id}/delete", status_code=status.HTTP_204_NO_CONTENT)
async def delete_model(model_id: int):
    """
    Deletes a model.

    Args:
        model_id (int): the id of the model to delete.

    Raises:
        HTTPException(404): if the model could not be found.
    """
    try:
        controller.delete_model(model_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model with id {model_id} not found.",
        )
