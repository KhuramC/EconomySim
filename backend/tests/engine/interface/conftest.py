import pytest
from engine.interface.controller import ModelController


@pytest.fixture()
def controller() -> ModelController:
    """
    A fixture for creating a `ModelController` and ensuring it initialized correctly.
    """

    controller = ModelController()
    assert controller.models == {}
    assert controller.next_id == 1
    return controller
