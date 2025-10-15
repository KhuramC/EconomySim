from enum import Enum
from typing import Any
from engine.types.industry_type import IndustryType
from engine.types.demographic import Demographic

# TODO: Adjust based on research for templates.
# could also make these into small_config.json, medium_config.json, large_config.json files and load them in
_SMALL_CONFIG = {
    "num_people": 1000,
    "demographics": {
        demo.value: {
            "income": {"mean": 1, "sd": 0},
            "proportion": 1 / 3,
            "unemployment_rate": 0.0,
            "spending_behavior": {
                itype.value: 1 / len(list(IndustryType)) for itype in IndustryType
            },
            "current_money": {"mean": 1, "sd": 0},
        }
        for demo in Demographic
    },
    "policies": {
        "corporate_income_tax": {itype.value: 1 for itype in IndustryType},
        "personal_income_tax": 1,
        "sales_tax": {itype.value: 1 for itype in IndustryType},
        "property_tax": 1,
        "tariffs": {itype.value: 1 for itype in IndustryType},
        "subsidies": {itype.value: 1 for itype in IndustryType},
        "minimum_wage": 1,
    },
    "inflation_rate": 0.001,
}
_MEDIUM_CONFIG = {
    "num_people": 10000,
    "demographics": {
        demo.value: {
            "income": {"mean": 1, "sd": 0},
            "proportion": 1 / 3,
            "unemployment_rate": 0.0,
            "spending_behavior": {
                itype.value: 1 / len(list(IndustryType)) for itype in IndustryType
            },
            "current_money": {"mean": 1, "sd": 0},
        }
        for demo in Demographic
    },
    "policies": {
        "corporate_income_tax": {itype.value: 1 for itype in IndustryType},
        "personal_income_tax": 1,
        "sales_tax": {itype.value: 1 for itype in IndustryType},
        "property_tax": 1,
        "tariffs": {itype.value: 1 for itype in IndustryType},
        "subsidies": {itype.value: 1 for itype in IndustryType},
        "minimum_wage": 1,
    },
    "inflation_rate": 0.001,
}
_LARGE_CONFIG = {
    "num_people": 100000,
    "demographics": {
        demo.value: {
            "income": {"mean": 1, "sd": 0},
            "proportion": 1 / 3,
            "unemployment_rate": 0.0,
            "spending_behavior": {
                itype.value: 1 / len(list(IndustryType)) for itype in IndustryType
            },
            "current_money": {"mean": 1, "sd": 0},
        }
        for demo in Demographic
    },
    "policies": {
        "corporate_income_tax": {itype.value: 1 for itype in IndustryType},
        "personal_income_tax": 1,
        "sales_tax": {itype.value: 1 for itype in IndustryType},
        "property_tax": 1,
        "tariffs": {itype.value: 1 for itype in IndustryType},
        "subsidies": {itype.value: 1 for itype in IndustryType},
        "minimum_wage": 1,
    },
    "inflation_rate": 0.001,
}


class CityTemplate(Enum):
    """
    An enumeration of city templates, with associated settings.
    The .value will be the string name, and .config will be the dictionary.
    """

    config: dict[str, Any]

    SMALL = ("small", _SMALL_CONFIG)
    MEDIUM = ("medium", _MEDIUM_CONFIG)
    LARGE = ("large", _LARGE_CONFIG)

    # This allows the enum to hold multiple values but still behave like a StrEnum
    def __new__(cls, value: str, config: dict[str, Any]):
        obj = object.__new__(cls)
        obj._value_ = value
        obj.config = config
        return obj

    # This makes str(CityTemplate.SMALL) return "small"
    def __str__(self):
        return self.value
