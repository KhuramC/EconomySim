from fastapi import FastAPI, HTTPException, WebSocket, status
from fastapi.middleware.cors import CORSMiddleware
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

origins = [
    "http://localhost:5173",  # React dev server
    "http://127.0.0.1:5173",  # React dev server pt.2
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers (like Content-Type)
)


class ModelCreateRequest(BaseModel):
    """Defines the expected structure for creating a new simulation model."""

    max_simulation_length: int = Field(
        ..., ge=1, description="Maximum length of the simulation in weeks."
    )
    num_people: int = Field(..., gt=0, description="Number of person agents to create.")
    inflation_rate: float = Field(..., ge=0.0, description="Weekly inflation rate.")
    random_events: bool = Field(
        ..., description="Whether to enable random events in the simulation."
    )
    demographics: dict[
        Demographic, dict[str, float | dict[str | IndustryType, float]]
    ] = Field(..., description="Demographic distribution for the population.")
    industries: dict[IndustryType, dict[str, float | int]] = Field(
        ..., description="Information about every industry."
    )
    policies: dict[str, float | dict[IndustryType, float]] = Field(
        ..., description="Policies for the simulation."
    )


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
        HTTPException(422): if the template name is not a valid CityTemplate value.

    Returns:
        config (dict): A dictionary of the number of people, the demographics, the starting policies, and the inflation rate.
    """

    config = template.config
    return config


@app.post("/models/create", status_code=status.HTTP_201_CREATED)
async def create_model(model_parameters: ModelCreateRequest) -> int:
    """
    Creates a model based on the given parameters.
    The default status code is 201 upon success.

    Args:
        model_parameters (ModelCreateRequest): The parameters for the model.

    Raises:
        HTTPException(422): If the arguments passed in did not follow the structure of ModelCreateRequest.
        HTTPException(404): If the demographics, industries, or policies within the arguments were not validated.

    Returns:
        model_id(int): The id associated with the created model.
    """
    try:
        model_id = controller.create_model(
            max_simulation_length=model_parameters.max_simulation_length,
            num_people=model_parameters.num_people,
            inflation_rate=model_parameters.inflation_rate,
            random_events=model_parameters.random_events,
            demographics=model_parameters.demographics,
            industries=model_parameters.industries,
            starting_policies=model_parameters.policies,
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
    The default status code is 200 upon success.

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
    The default status code is 204 upon success.

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

    json_string = df.to_json(orient="records")  # list of dataframe rows
    return Response(content=json_string, media_type="application/json")


@app.get("/models/{model_id}/indicators", status_code=status.HTTP_200_OK)
async def get_model_indicators(
    model_id: int,
    start_time: int,
    end_time: int,
) -> Response:
    """
    Retrieves the indicators from a model at the timeframe desired.
    The default status code is 200 upon success.

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
    The default status code is 204 upon success.

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
    Allows for stepping with "step", and getting indicators with "indicators".

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
    The default status code is 204 upon success.

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
