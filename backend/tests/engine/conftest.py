import pytest
from engine.types.industry_type import IndustryType

TAX_RATES = {
    "corporate_income_tax": {itype.value: 0.0 for itype in IndustryType},
    "personal_income_tax": 0.0,
    "sales_tax": {itype.value: 0.0 for itype in IndustryType},
    "property_tax": 0.0,
    "tariffs": {itype.value: 0.0 for itype in IndustryType},
}


@pytest.fixture
def tax_rates():
    return TAX_RATES
