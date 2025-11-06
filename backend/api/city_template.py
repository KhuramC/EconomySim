from enum import Enum
from typing import Any
from engine.types.industry_type import IndustryType
from engine.types.demographic import Demographic

# SMALL CITY TEMPLATE (e.g. Columbia, MO)
# Median Income: $57k
# Profile: High poverty, college town, larger lower-income bracket.
_SMALL_CONFIG = {
    "num_people": 1000,
    "inflation_rate": 0.0005,  # Inflation Rate is weekly; equates to 2.6% annually
    "demographics": {
        Demographic.LOWER_CLASS: {
            "income": {"mean": 6.31, "sd": 0.40},  # Median: $548/wk (~$28.5k/yr)
            "proportion": 0.35,
            "unemployment_rate": 0.00,
            "spending_behavior": {
                IndustryType.GROCERIES: 0.15,
                IndustryType.UTILITIES: 0.11,
                IndustryType.AUTOMOBILES: 0.25,
                IndustryType.HOUSING: 0.28,
                IndustryType.HOUSEHOLD_GOODS: 0.04,
                IndustryType.ENTERTAINMENT: 0.07,
                IndustryType.LUXURY: 0.10,
            },
            "balance": {"mean": 6.0, "sd": 0.5},  # Low savings
        },
        Demographic.MIDDLE_CLASS: {
            "income": {"mean": 7.00, "sd": 0.30},  # Median: $1096/wk (~$57k/yr)
            "proportion": 0.50,
            "unemployment_rate": 0.00,
            "spending_behavior": {
                IndustryType.GROCERIES: 0.12,
                IndustryType.UTILITIES: 0.09,
                IndustryType.AUTOMOBILES: 0.23,
                IndustryType.HOUSING: 0.23,
                IndustryType.HOUSEHOLD_GOODS: 0.03,
                IndustryType.ENTERTAINMENT: 0.12,
                IndustryType.LUXURY: 0.18,
            },
            "balance": {"mean": 8.5, "sd": 0.4},  # Moderate savings
        },
        Demographic.UPPER_CLASS: {
            "income": {"mean": 7.92, "sd": 0.60},  # Median: $2740/wk (~$142.5k/yr)
            "proportion": 0.15,
            "unemployment_rate": 0.00,
            "spending_behavior": {
                IndustryType.GROCERIES: 0.10,
                IndustryType.UTILITIES: 0.08,
                IndustryType.AUTOMOBILES: 0.20,
                IndustryType.HOUSING: 0.20,
                IndustryType.HOUSEHOLD_GOODS: 0.03,
                IndustryType.ENTERTAINMENT: 0.14,
                IndustryType.LUXURY: 0.25,
            },
            "balance": {"mean": 11.0, "sd": 0.7},  # High savings
        },
    },
    "industries": {
        itype: {
            "price": 10.0 + i * 5.0,
            "inventory": 1000 + i * 500,
            "balance": 50000 + i * 10000,
            "offered_wage": 15.0 + i * 2.5,
        }
        for i, itype in enumerate(IndustryType)
    },
    "policies": {
        "corporate_income_tax": {itype.value: 1 for itype in IndustryType},
        "personal_income_tax": {demo.value: 1 for demo in Demographic},
        "sales_tax": {itype.value: 1 for itype in IndustryType},
        "property_tax": 1,
        "tariffs": {itype.value: 1 for itype in IndustryType},
        "subsidies": {itype.value: 1 for itype in IndustryType},
        "rent_cap": 0.0,
        "minimum_wage": 1,
    },
}

# MEDIUM CITY TEMPLATE (e.g. Madison, WI)
# Median Income: $73k
# Profile: Stable, large middle class
_MEDIUM_CONFIG = {
    "num_people": 10000,
    "inflation_rate": 0.0005,  # Inflation Rate is weekly
    "demographics": {
        Demographic.LOWER_CLASS: {
            "income": {"mean": 6.55, "sd": 0.40},  # Median: $702/wk (~$36.5k/yr)
            "proportion": 0.30,
            "unemployment_rate": 0.00,
            "spending_behavior": {
                IndustryType.GROCERIES: 0.16,
                IndustryType.UTILITIES: 0.12,
                IndustryType.AUTOMOBILES: 0.16,
                IndustryType.HOUSING: 0.30,
                IndustryType.HOUSEHOLD_GOODS: 0.05,
                IndustryType.ENTERTAINMENT: 0.07,
                IndustryType.LUXURY: 0.14,
            },
            "balance": {"mean": 6.0, "sd": 0.5},  # Low savings
        },
        Demographic.MIDDLE_CLASS: {
            "income": {"mean": 7.25, "sd": 0.30},  # Median: $1404/wk (~$73k/yr)
            "proportion": 0.55,
            "unemployment_rate": 0.00,
            "spending_behavior": {
                IndustryType.GROCERIES: 0.10,
                IndustryType.UTILITIES: 0.10,
                IndustryType.AUTOMOBILES: 0.15,
                IndustryType.HOUSING: 0.26,
                IndustryType.HOUSEHOLD_GOODS: 0.04,
                IndustryType.ENTERTAINMENT: 0.12,
                IndustryType.LUXURY: 0.25,
            },
            "balance": {"mean": 8.5, "sd": 0.4},  # Moderate savings
        },
        Demographic.UPPER_CLASS: {
            "income": {"mean": 8.16, "sd": 0.60},  # Median: $3510/wk (~$182.5k/yr)
            "proportion": 0.15,
            "unemployment_rate": 0.00,
            "spending_behavior": {
                IndustryType.GROCERIES: 0.10,
                IndustryType.UTILITIES: 0.10,
                IndustryType.AUTOMOBILES: 0.15,
                IndustryType.HOUSING: 0.24,
                IndustryType.HOUSEHOLD_GOODS: 0.04,
                IndustryType.ENTERTAINMENT: 0.12,
                IndustryType.LUXURY: 0.25,
            },
            "balance": {"mean": 11.0, "sd": 0.7},  # High savings
        },
    },
    "policies": {
        "corporate_income_tax": {itype.value: 1 for itype in IndustryType},
        "personal_income_tax": {demo.value: 1 for demo in Demographic},
        "sales_tax": {itype.value: 1 for itype in IndustryType},
        "property_tax": 1,
        "tariffs": {itype.value: 1 for itype in IndustryType},
        "subsidies": {itype.value: 1 for itype in IndustryType},
        "rent_cap": 0.0,
        "minimum_wage": 1,
    },
}

# LARGE CITY TEMPLATE (e.g. San Francisco, CA)
# Median Income: $126k
# Profile: Extreme wealth, high cost of living, higher inequality
_LARGE_CONFIG = {
    "num_people": 100000,
    "inflation_rate": 0.0005,  # Inflation Rate is weekly
    "demographics": {
        Demographic.LOWER_CLASS: {
            "income": {"mean": 6.76, "sd": 0.40},  # Median: $865/wk (~$45k/yr)
            "proportion": 0.35,
            "unemployment_rate": 0.00,
            "spending_behavior": {
                IndustryType.GROCERIES: 0.14,
                IndustryType.UTILITIES: 0.15,
                IndustryType.AUTOMOBILES: 0.05,
                IndustryType.HOUSING: 0.45,
                IndustryType.HOUSEHOLD_GOODS: 0.06,
                IndustryType.ENTERTAINMENT: 0.05,
                IndustryType.LUXURY: 0.10,
            },
            "balance": {"mean": 6.0, "sd": 0.5},  # Low savings
        },
        Demographic.MIDDLE_CLASS: {
            "income": {"mean": 7.79, "sd": 0.30},  # Median: $2423/wk (~$126k/yr)
            "proportion": 0.40,
            "unemployment_rate": 0.00,
            "spending_behavior": {
                IndustryType.GROCERIES: 0.12,
                IndustryType.UTILITIES: 0.12,
                IndustryType.AUTOMOBILES: 0.08,
                IndustryType.HOUSING: 0.38,
                IndustryType.HOUSEHOLD_GOODS: 0.05,
                IndustryType.ENTERTAINMENT: 0.08,
                IndustryType.LUXURY: 0.17,
            },
            "balance": {"mean": 8.5, "sd": 0.4},  # Moderate savings
        },
        Demographic.UPPER_CLASS: {
            "income": {"mean": 8.71, "sd": 0.60},  # Median: $6058/wk (~$315k/yr)
            "proportion": 0.25,
            "unemployment_rate": 0.00,
            "spending_behavior": {
                IndustryType.GROCERIES: 0.10,
                IndustryType.UTILITIES: 0.10,
                IndustryType.AUTOMOBILES: 0.10,
                IndustryType.HOUSING: 0.26,
                IndustryType.HOUSEHOLD_GOODS: 0.04,
                IndustryType.ENTERTAINMENT: 0.15,
                IndustryType.LUXURY: 0.25,
            },
            "balance": {"mean": 11.0, "sd": 0.7},  # High savings
        },
    },
    "industries": {
        itype: {
            "price": 10.0 + i * 5.0,
            "inventory": 1000 + i * 500,
            "balance": 50000 + i * 10000,
            "offered_wage": 15.0 + i * 2.5,
        }
        for i, itype in enumerate(IndustryType)
    },
    "policies": {
        "corporate_income_tax": {itype.value: 1 for itype in IndustryType},
        "personal_income_tax": {demo.value: 1 for demo in Demographic},
        "sales_tax": {itype.value: 1 for itype in IndustryType},
        "property_tax": 1,
        "tariffs": {itype.value: 1 for itype in IndustryType},
        "subsidies": {itype.value: 1 for itype in IndustryType},
        "rent_cap": 0.0,
        "minimum_wage": 1,
    },
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
