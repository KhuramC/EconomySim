import pytest
from fastapi.testclient import TestClient
from fastapi import status
from typing import Iterator, Any

from engine.types.demographic import Demographic
from engine.types.industry_type import IndustryType
from api.main import app


VALID_CONFIG = {
    "num_people": 100,
    "demographics": {
        demo.value: {
            "income": {"mean": 300 + (i * 500), "sd": 100},
            "proportion": 1 / len(Demographic),
            "unemployment_rate": 0.1 - (i * 0.02),
            "spending_behavior": {
                itype.value: 1 / len(IndustryType) for itype in IndustryType
            },
            "current_money": {"mean": 500 + (i * 2000), "sd": 100},
        }
        for i, demo in enumerate(Demographic)
    },
    "policies": {
        "corporate_income_tax": {itype.value: 0.2 for itype in IndustryType},
        "personal_income_tax": 0.15,
        "sales_tax": {itype.value: 0.05 for itype in IndustryType},
        "property_tax": 0.02,
        "tariffs": {itype.value: 0.03 for itype in IndustryType},
        "subsidies": {itype.value: 0.0 for itype in IndustryType},
        "minimum_wage": 15.0,
    },
    "inflation_rate": 0.001,
}
"""A payload/config that should pass a validate_schema call by an EconomyModel."""


@pytest.fixture(scope="module")  # do not need a completely new client per function.
def api_client() -> Iterator[TestClient]:
    """
    A fixture that provides a FastAPI TestClient for the application.
    """
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def valid_config() -> dict[str, Any]:
    """
    A fixture that returns a valid config for creating a simulation.

    Returns:
        VALID_CONFIG (dict): A dictionary consisting of the number of people, demographics, policies, and the inflation rate.
    """
    return VALID_CONFIG


@pytest.fixture()
def created_model(api_client: TestClient, valid_config: dict) -> Iterator[int]:
    """
    A fixture to create a model and then delete it upon teardown.
    Upon teardown, testing for successful deletion is done and is considered the test for the delete_model endpoint.

    Args:
        client (TestClient): the test client to connect to the FastAPI server.
        valid_config (dict): a valid config to create a model.

    Yields:
        model_id (id): the id of the model created.
    """

    response = api_client.post("/models/create", json=valid_config)
    assert (
        response.status_code == status.HTTP_201_CREATED
    ), f"Failed to create model: {response.json()}"
    model_id = response.json()

    yield model_id  # Provide the model_id to be used

    # Teardown: delete the model after the test finishes
    response = api_client.delete(f"/models/{model_id}/delete")
    assert (
        response.status_code == status.HTTP_204_NO_CONTENT
    ), f"Failed to delete model: {response.json()}"

    # Check to ensure that model is truly deleted
    response = api_client.delete(f"/models/{model_id}/delete")
    assert response.status_code == status.HTTP_404_NOT_FOUND

    args = {
        "start_time": 0,
        "end_time": 0,
        "indicators": None
    }
    response = api_client.get(f"/models/{model_id}/indicators", params=args)
    assert response.status_code == status.HTTP_404_NOT_FOUND
