import pytest
from engine.interface.controller import ModelController


@pytest.fixture
def controller():
    controller = ModelController()
    assert controller.models == {}
    assert controller.next_id == 1
    return controller
