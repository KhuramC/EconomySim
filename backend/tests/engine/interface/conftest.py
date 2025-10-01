import pytest
from backend.engine.interface.controller import ModelController
from backend.engine.types.IndustryType import IndustryType

TAX_RATES = {
    "corporate_income_tax": {itype.value: 0.0 for itype in IndustryType},
    "personal_income_tax": 0.0,
    "sales_tax": {itype.value: 0.0 for itype in IndustryType},
    "property_tax": 0.0,
    "tariffs": {itype.value: 0.0 for itype in IndustryType},
}


@pytest.fixture
def controller():
    controller = ModelController()
    assert controller.models == {}
    assert controller.next_id == 1
    return controller

@pytest.fixture
def tax_rates():
    return TAX_RATES
    