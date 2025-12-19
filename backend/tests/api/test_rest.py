from fastapi.testclient import TestClient
from fastapi import status
from fastapi.encoders import jsonable_encoder
import pytest
from pytest import mark
from typing import Any

from api.city_template import CityTemplate
from engine.types.demographic import Demographic

template_test_params = [
    pytest.param(
        template.value,
        status.HTTP_200_OK,
        jsonable_encoder(template.config),
        id=f"{template.value} template",
    )
    for template in list(CityTemplate)
]
template_test_params.append(
    pytest.param(
        "invalid", status.HTTP_422_UNPROCESSABLE_ENTITY, None, id="invalid template"
    ),
)


@mark.parametrize(
    "template,status_code,expected_config",
    template_test_params,
)
def test_get_city_template_config(
    api_client: TestClient,
    template: str,
    status_code: int,
    expected_config: dict[str, Any] | None,
):
    """
    Parametrized test for `get_city_template_config`, an API endpoint.
    Tests with all valid configs, and then with an invalid one.

    Args:
        api_client (TestClient): the test client to connect to the FastAPI server.
        template (str): the city template string.
        status_code (int): the expected return status code from calling the method.
        expected_config (dict[str, Any] | None): The expected config, or nothing if it is meant to be invalid.
    """

    response = api_client.get(f"/templates/{template}")
    assert response.status_code == status_code
    if status_code == status.HTTP_200_OK:
        config = response.json()
        assert config["num_people"] > 0  # Check that it returns a valid config dict
        assert "policies" in config
        assert config == expected_config


@mark.parametrize(
    "invalid_config,status_code",
    [
        pytest.param(
            ("num_people",), status.HTTP_422_UNPROCESSABLE_ENTITY, id="invalid payload"
        ),
        pytest.param(
            ("population", "spending_behaviors", Demographic.LOWER_CLASS),
            status.HTTP_400_BAD_REQUEST,
            id="invalid_demographics",
        ),
        pytest.param(
            ("policies", "corporate_income_tax"),
            status.HTTP_400_BAD_REQUEST,
            id="invalid_policies",
        ),
    ],
    indirect=["invalid_config"],
)
def test_create_model_fail(
    api_client: TestClient, invalid_config: dict[str, Any], status_code: int
):
    """
    Parametrized test for `create_model` failing, an API endpoint.
    Tests against the ModelCreateRequest to ensure it works or against
    the validation of policies/demographics, which result in slightly different status codes.

    Args:
        api_client (TestClient): the test client to connect to the FastAPI server.
        invalid_config (dict[str, Any]): an invalid configuration for setting up a simulation.
        status_code (int): the expected return status code from calling the method.
    """

    response = api_client.post("/models/create", json=invalid_config)
    assert response.status_code == status_code
