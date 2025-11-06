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
        "corporate_income_tax": {itype.value: 0.04 for itype in IndustryType},
        "personal_income_tax": [
            (176.75, 0.000882),  # Annual: ($9,191, 4.7%)
            (151.50, 0.000846),  # Annual: ($7,878, 4.5%)
            (126.25, 0.000754),  # Annual: ($6,565, 4.0%)
            (101.00, 0.000662),  # Annual: ($5,252, 3.5%)
            (75.75, 0.000570),  # Annual: ($3,939, 3.0%)
            (50.50, 0.000476),  # Annual: ($2,626, 2.5%)
            (25.25, 0.000381),  # Annual: ($1,313, 2.0%)
            (0, 0.0),  # Annual: ($0, 0.0%)
        ],
        "sales_tax": {
            itype.value: 0.000933 if itype == IndustryType.GROCERIES else 0.001476
            for itype in IndustryType
        },  # Annual: 4.975% for food, 7.975% general
        "property_tax": {
            "residential": 0.000176,
            "commercial": 0.000410,
        },  # Annual: 0.92%, 2.159%
        "tariffs": {
            IndustryType.GROCERIES: 0.004301,  # Annual: 25%
            IndustryType.UTILITIES: 0.0,  # (Domestic service)
            IndustryType.AUTOMOBILES: 0.004301,  # Annual: 25%
            IndustryType.HOUSING: 0.001835,  # Annual: 10%
            IndustryType.HOUSEHOLD_GOODS: 0.004301,  # Annual: 25%
            IndustryType.ENTERTAINMENT: 0.0,  # (Domestic service)
            IndustryType.LUXURY: 0.001835,  # Annual: 10%
        },
        "subsidies": {itype.value: 1 for itype in IndustryType},
        "rent_cap": 0.0,  # No state or local rent control
        "minimum_wage": 550.00,  # $13.75/hr x 40 hrs
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
        "corporate_income_tax": {
            itype.value: 0.079 for itype in IndustryType
        },  # Flat rate
        "personal_income_tax": [
            (6063.65, 0.001416),  # Annual: ($315,310, 7.65%)
            (550.77, 0.000992),  # Annual: ($28,640, 5.3%)
            (275.38, 0.000828),  # Annual: ($14,320, 4.4%)
            (0, 0.000662),  # Annual: ($0, 3.5%)
        ],
        "sales_tax": {
            itype.value: 0.0 if itype == IndustryType.GROCERIES else 0.001030
            for itype in IndustryType
        },  # Annual: 0.0% for food, 5.50% general
        "property_tax": {
            "residential": 0.000339,
            "commercial": 0.000339,
        },  # Annual: 1.78%
        "tariffs": {
            IndustryType.GROCERIES: 0.004301,  # Annual: 25%
            IndustryType.UTILITIES: 0.0,  # (Domestic service)
            IndustryType.AUTOMOBILES: 0.004301,  # Annual: 25%
            IndustryType.HOUSING: 0.001835,  # Annual: 10%
            IndustryType.HOUSEHOLD_GOODS: 0.004301,  # Annual: 25%
            IndustryType.ENTERTAINMENT: 0.0,  # (Domestic service)
            IndustryType.LUXURY: 0.001835,  # Annual: 10%
        },
        "subsidies": {itype.value: 1 for itype in IndustryType},
        "rent_cap": 0.0,  # No state or local rent control
        "minimum_wage": 290.00,  # $7.25/hr x 40 hrs
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
        "corporate_income_tax": {
            itype.value: 0.0884 for itype in IndustryType
        },  # Flat rate
        "personal_income_tax": [
            (13871.42, 0.002235),  # Annual: ($721,314, 12.3%)
            (8322.83, 0.002061),  # Annual: ($432,787, 11.3%)
            (6935.75, 0.001886),  # Annual: ($360,659, 10.3%)
            (1357.81, 0.001713),  # Annual: ($70,606, 9.3%)
            (1074.35, 0.001479),  # Annual: ($55,866, 8.0%)
            (773.94, 0.001121),  # Annual: ($40,245, 6.0%)
            (490.37, 0.000754),  # Annual: ($25,499, 4.0%)
            (206.85, 0.000381),  # Annual: ($10,756, 2.0%)
            (0, 0.000191),  # Annual: ($0, 1.0%)
        ],
        "sales_tax": {
            itype.value: 0.0 if itype == IndustryType.GROCERIES else 0.001586
            for itype in IndustryType
        },  # Annual: 0.0% for food, 8.625% general
        "property_tax": {
            "residential": 0.000126,
            "commercial": 0.000126,
        },  # Annual: 0.66%
        "tariffs": {
            IndustryType.GROCERIES: 0.004301,  # Annual: 25%
            IndustryType.UTILITIES: 0.0,  # (Domestic service)
            IndustryType.AUTOMOBILES: 0.004301,  # Annual: 25%
            IndustryType.HOUSING: 0.001835,  # Annual: 10%
            IndustryType.HOUSEHOLD_GOODS: 0.004301,  # Annual: 25%
            IndustryType.ENTERTAINMENT: 0.0,  # (Domestic service)
            IndustryType.LUXURY: 0.001835,  # Annual: 10%
        },
        "subsidies": {itype.value: 1 for itype in IndustryType},
        "rent_cap": 0.000267,  # Annual: 1.4%
        "minimum_wage": 767.20,  # $19.18/hr x 40 hrs
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
