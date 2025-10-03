from enum import Enum
from typing import Any

# TODO: Adjust based on research for templates.
_SMALL_CONFIG = {
    "num_people": 1000,
    "starting_policies": {
        "corporate_income_tax": {"default": 0.15},
        "personal_income_tax": 0.20,
        "sales_tax": {"default": 0.05},
        "property_tax": 0.015,
        "tariffs": {"default": 0.03},
    },
    "starting_unemployment_rate": 0.05,
    "inflation_rate": 0.001,
}
_MEDIUM_CONFIG = {
    "num_people": 10000,
    "starting_policies": {
        "corporate_income_tax": {"default": 0.20},
        "personal_income_tax": 0.25,
        "sales_tax": {"default": 0.06},
        "property_tax": 0.012,
        "tariffs": {"default": 0.04},
    },
    "starting_unemployment_rate": 0.04,
    "inflation_rate": 0.0015,
}
_LARGE_CONFIG = {
    "num_people": 100000,
    "starting_policies": {
        "corporate_income_tax": {"default": 0.21},
        "personal_income_tax": 0.28,
        "sales_tax": {"default": 0.04},
        "property_tax": 0.01,
        "tariffs": {"default": 0.05},
    },
    "starting_unemployment_rate": 0.06,
    "inflation_rate": 0.002,
}


class CityTemplate(Enum):
    """
    An enumeration of city templates, with associated settings.
    The .value will be the string name, and .settings will be the dictionary.
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
