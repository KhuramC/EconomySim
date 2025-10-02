import pytest
from backend.engine.core.model import EconomyModel

@pytest.fixture
def model(tax_rates):
    model = EconomyModel(100, tax_rates)
    # TODO: test demographics properly being created
    
    return model
    