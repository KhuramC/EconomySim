from mesa import Model
import pytest
from backend.engine.types.IndustryType import IndustryType

class MockEconomyModel(Model):
    """
    A mock EconomyModel for unit testing.
    """

    def __init__(self):
        super().__init__()
        self.tax_rates = {
            "corporate_income_tax": {itype.value: 1.0 for itype in IndustryType},
            "personal_income_tax": 2.0,
            "sales_tax": {itype.value: 3.0 for itype in IndustryType},
            "property_tax": 4.0,
            "tariffs": {itype.value: i * 2.5 for i, itype in enumerate(IndustryType)},
        }


@pytest.fixture
def mock_economy_model():
    return MockEconomyModel()

