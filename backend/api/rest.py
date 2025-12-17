from fastapi import HTTPException, status
from pydantic import BaseModel, Field
from typing import Any
import logging

from engine.types.industry_type import IndustryType
from engine.types.demographic import Demographic
from .city_template import CityTemplate
from .dependencies import get_controller, get_router

controller = get_controller()
router = get_router()

logger = logging.getLogger("REST API")


class ModelCreateRequest(BaseModel):
    """Defines the expected structure for creating a new simulation model."""

    max_simulation_length: int = Field(
        ..., ge=1, description="Maximum length of the simulation in weeks."
    )
    num_people: int = Field(..., gt=0, description="Number of person agents to create.")
    inflation_rate: float = Field(..., ge=0.0, description="Weekly inflation rate.")
    demographics: dict[
        Demographic, dict[str, float | dict[str | IndustryType, float]]
    ] = Field(..., description="Demographic distribution for the population.")
    industries: dict[IndustryType, dict[str, float | int]] = Field(
        ..., description="Information about every industry."
    )
    policies: dict[str, Any] = Field(..., description="Policies for the simulation.")


# API REST Endpoints


@router.get("/api/health", status_code=status.HTTP_200_OK)
async def root():
    """Sanity check for the API."""
    return {"message": "EconomySim API is running."}


@router.get("/templates/{template}", status_code=status.HTTP_200_OK)
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
    logger.info(f"Getting city template config for template: {template.value}")
    config = template.config
    return config


@router.post("/models/create", status_code=status.HTTP_201_CREATED)
async def create_model(
    model_parameters: ModelCreateRequest,
) -> int:
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
    logger.info("Creating a new model.")
    try:
        model_id = controller.create_model(
            max_simulation_length=model_parameters.max_simulation_length,
            num_people=model_parameters.num_people,
            inflation_rate=model_parameters.inflation_rate,
            demographics=model_parameters.demographics,
            industries=model_parameters.industries,
            starting_policies=model_parameters.policies,
        )
        logger.info(f"Successfully created model with id: {model_id}")
        return model_id
    except ValueError as e:
        logger.error(f"Error creating model: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/models/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_model(model_id: int):
    """
    Deletes a model.
    The default status code is 204 upon success.

    Args:
        model_id (int): the id of the model to delete.

    Raises:
        HTTPException(404): if the model could not be found.
    """
    logger.info(f"Deleting model with id: {model_id}")
    try:
        controller.delete_model(model_id)
        logger.info(f"Successfully deleted model with id: {model_id}")
    except ValueError:
        logger.warning(f"Model with id {model_id} not found for deletion.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model with id {model_id} not found.",
        )
