import pytest
from fastapi.testclient import TestClient

from engine.types.demographic import Demographic
from engine.types.industry_type import IndustryType
from api.main import app


@pytest.fixture(scope="module")  # do not need to recreate test module per function
def client():
    """
    A pytest fixture that provides a FastAPI TestClient for the application.
    """
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def payload():
    payload = {
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
    return payload


@pytest.fixture(scope="function")
def created_model(client: TestClient, payload: dict):
    """
    Creates a model via the API and yields its ID.
    Cleans up by deleting the model after the test is done.
    The scope="function" ensures each test gets a fresh model.
    """

    response = client.post("/models", json=payload)
    assert response.status_code == 201, f"Failed to create model: {response.json()}"
    model_id = response.json()["model_id"]

    yield model_id  # Provide the model_id to the test

    # Teardown: delete the model after the test finishes
    client.delete(f"/models/{model_id}")
