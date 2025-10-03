import pytest
from engine.types.industry_type import IndustryType

POLICIES = {
    "corporate_income_tax": {itype.value: i for i, itype in enumerate(IndustryType)},
    "personal_income_tax": 2.0,
    "sales_tax": {itype.value: i^2 for i, itype in enumerate(IndustryType)},
    "property_tax": 4.0,
    "tariffs": {itype.value: i * 2.5 for i, itype in enumerate(IndustryType)},
    "subsidies": {itype.value: i*-2 for i, itype in enumerate(IndustryType)},
    "minimum_wage": 7.25,
}

@pytest.fixture
def policies():
    return POLICIES
