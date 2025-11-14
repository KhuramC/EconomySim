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
        IndustryType.GROCERIES: {
            "starting_price": 62.47,
            "starting_inventory": 504000,
            "starting_balance": 199992.00,
            "starting_offered_wage": 823.20,
            "starting_fixed_cost": 7692.00,
            "starting_raw_mat_cost": 42.48,
            "starting_number_of_employees": 162,
            "starting_worker_efficiency": 19.444,
            "starting_debt_allowed": True,
            "starting_demand_intercept": 166.59,
            "starting_demand_slope": 0.000826,
        },
        IndustryType.UTILITIES: {
            "starting_price": 50.08,
            "starting_inventory": 201600,
            "starting_balance": 51843584.00,
            "starting_offered_wage": 1354.60,
            "starting_fixed_cost": 1993984.00,
            "starting_raw_mat_cost": 10.52,
            "starting_number_of_employees": 63,
            "starting_worker_efficiency": 20.00,
            "starting_debt_allowed": True,
            "starting_demand_intercept": 434.76,
            "starting_demand_slope": 0.00763,
        },
        IndustryType.AUTOMOBILES: {
            "starting_price": 25000.00,
            "starting_inventory": 484,
            "starting_balance": 39988.00,
            "starting_offered_wage": 823.20,
            "starting_fixed_cost": 1538.00,
            "starting_raw_mat_cost": 22500.00,
            "starting_number_of_employees": 122,
            "starting_worker_efficiency": 0.0248,
            "starting_debt_allowed": True,
            "starting_demand_intercept": 50000.00,
            "starting_demand_slope": 206.612,
        },
        IndustryType.HOUSING: {
            "starting_price": 230.77,
            "starting_inventory": 120960,
            "starting_balance": 154183146.00,
            "starting_offered_wage": 1188.40,
            "starting_fixed_cost": 5930121.00,
            "starting_raw_mat_cost": 11.54,
            "starting_number_of_employees": 274,
            "starting_worker_efficiency": 2.7591,
            "starting_debt_allowed": True,
            "starting_demand_intercept": 998.87,
            "starting_demand_slope": 0.02540,
        },
        IndustryType.HOUSEHOLD_GOODS: {
            "starting_price": 75.00,
            "starting_inventory": 40320,
            "starting_balance": 99996.00,
            "starting_offered_wage": 823.20,
            "starting_fixed_cost": 3846.00,
            "starting_raw_mat_cost": 30.00,
            "starting_number_of_employees": 81,
            "starting_worker_efficiency": 3.111,
            "starting_debt_allowed": True,
            "starting_demand_intercept": 241.67,
            "starting_demand_slope": 0.01653,
        },
        IndustryType.ENTERTAINMENT: {
            "starting_price": 18.00,
            "starting_inventory": 126000,
            "starting_balance": 80002.00,
            "starting_offered_wage": 991.60,
            "starting_fixed_cost": 3077.00,
            "starting_raw_mat_cost": 4.95,
            "starting_number_of_employees": 290,
            "starting_worker_efficiency": 2.7155,
            "starting_debt_allowed": True,
            "starting_demand_intercept": 33.00,
            "starting_demand_slope": 0.000476,
        },
        IndustryType.LUXURY: {
            "starting_price": 1500.00,
            "starting_inventory": 504,
            "starting_balance": 10010.00,
            "starting_offered_wage": 1234.80,
            "starting_fixed_cost": 385.00,
            "starting_raw_mat_cost": 150.00,
            "starting_number_of_employees": 8,
            "starting_worker_efficiency": 0.3937,
            "starting_debt_allowed": True,
            "starting_demand_intercept": 2500.00,
            "starting_demand_slope": 7.937,
        },
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
        "price_cap": {itype.value: None for itype in IndustryType},
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
    "industries": {
        IndustryType.GROCERIES: {
            "starting_price": 64.02,
            "starting_inventory": 1108000,
            "starting_balance": 800000.00,
            "starting_offered_wage": 1035.60,
            "starting_fixed_cost": 30769.00,
            "starting_raw_mat_cost": 43.53,
            "starting_number_of_employees": 1622,
            "starting_worker_efficiency": 4.2694,
            "starting_debt_allowed": True,
            "starting_demand_intercept": 170.72,
            "starting_demand_slope": 0.000385,
        },
        IndustryType.UTILITIES: {
            "starting_price": 49.85,
            "starting_inventory": 443200,
            "starting_balance": 113478144.00,
            "starting_offered_wage": 1563.64,
            "starting_fixed_cost": 4364544.00,
            "starting_raw_mat_cost": 10.47,
            "starting_number_of_employees": 633,
            "starting_worker_efficiency": 4.3760,
            "starting_debt_allowed": True,
            "starting_demand_intercept": 433.51,
            "starting_demand_slope": 0.00346,
        },
        IndustryType.AUTOMOBILES: {
            "starting_price": 24000.00,
            "starting_inventory": 1064,
            "starting_balance": 160004.00,
            "starting_offered_wage": 1035.60,
            "starting_fixed_cost": 6154.00,
            "starting_raw_mat_cost": 21600.00,
            "starting_number_of_employees": 1217,
            "starting_worker_efficiency": 0.0055,
            "starting_debt_allowed": True,
            "starting_demand_intercept": 48000.00,
            "starting_demand_slope": 90.226,
        },
        IndustryType.HOUSING: {
            "starting_price": 346.15,
            "starting_inventory": 265920,
            "starting_balance": 504665980.00,
            "starting_offered_wage": 1285.20,
            "starting_fixed_cost": 19410230.00,
            "starting_raw_mat_cost": 17.31,
            "starting_number_of_employees": 2736,
            "starting_worker_efficiency": 0.6075,
            "starting_debt_allowed": True,
            "starting_demand_intercept": 1500.00,
            "starting_demand_slope": 0.01736,
        },
        IndustryType.HOUSEHOLD_GOODS: {
            "starting_price": 85.00,
            "starting_inventory": 88640,
            "starting_balance": 400010.00,
            "starting_offered_wage": 1035.60,
            "starting_fixed_cost": 15385.00,
            "starting_raw_mat_cost": 34.00,
            "starting_number_of_employees": 811,
            "starting_worker_efficiency": 0.6831,
            "starting_debt_allowed": True,
            "starting_demand_intercept": 274.44,
            "starting_demand_slope": 0.00855,
        },
        IndustryType.ENTERTAINMENT: {
            "starting_price": 14.00,
            "starting_inventory": 277000,
            "starting_balance": 319999.00,
            "starting_offered_wage": 1248.40,
            "starting_fixed_cost": 12308.00,
            "starting_raw_mat_cost": 3.85,
            "starting_number_of_employees": 2900,
            "starting_worker_efficiency": 0.5970,
            "starting_debt_allowed": True,
            "starting_demand_intercept": 25.67,
            "starting_demand_slope": 0.000168,
        },
        IndustryType.LUXURY: {
            "starting_price": 1500.00,
            "starting_inventory": 1108,
            "starting_balance": 39988.00,
            "starting_offered_wage": 1553.40,
            "starting_fixed_cost": 1538.00,
            "starting_raw_mat_cost": 150.00,
            "starting_number_of_employees": 81,
            "starting_worker_efficiency": 0.0855,
            "starting_debt_allowed": True,
            "starting_demand_intercept": 2500.00,
            "starting_demand_slope": 3.610,
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
        "price_cap": {itype.value: None for itype in IndustryType},
        "minimum_wage": 290.00,  # $7.25/hr x 40 hrs
    },
}

# LARGE CITY TEMPLATE (e.g. San Francisco, CA)
# Median Income: $126k
# Profile: Extreme wealth, high cost of living, higher inequality
_LARGE_CONFIG = {
    "num_people": 75220,
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
    IndustryType.GROCERIES: {
        "starting_price": 76.82,
        "starting_inventory": 3260000,
        "starting_balance": 3302988.00,
        "starting_offered_wage": 1435.60,
        "starting_fixed_cost": 127038.00,
        "starting_raw_mat_cost": 52.24,
        "starting_number_of_employees": 12400,
        "starting_worker_efficiency": 1.643,
        "starting_debt_allowed": True,
        "starting_demand_intercept": 204.85,
        "starting_demand_slope": 0.000157,
    },
    IndustryType.UTILITIES: {
        "starting_price": 64.27,
        "starting_inventory": 1304000,
        "starting_balance": 430329120.00,
        "starting_offered_wage": 1998.88,
        "starting_fixed_cost": 16551120.00,
        "starting_raw_mat_cost": 13.50,
        "starting_number_of_employees": 4800,
        "starting_worker_efficiency": 1.700,
        "starting_debt_allowed": True,
        "starting_demand_intercept": 559.43,
        "starting_demand_slope": 0.00152,
    },
    IndustryType.AUTOMOBILES: {
        "starting_price": 30000.00,
        "starting_inventory": 3136,
        "starting_balance": 660790.00,
        "starting_offered_wage": 1435.60,
        "starting_fixed_cost": 25415.00,
        "starting_raw_mat_cost": 27000.00,
        "starting_number_of_employees": 9300,
        "starting_worker_efficiency": 0.002,
        "starting_debt_allowed": True,
        "starting_demand_intercept": 60000.00,
        "starting_demand_slope": 38.265,
    },
    IndustryType.HOUSING: {
        "starting_price": 761.54,
        "starting_inventory": 782400,
        "starting_balance": 3178195358.00,
        "starting_offered_wage": 2010.00,
        "starting_fixed_cost": 122238283.00,
        "starting_raw_mat_cost": 38.08,
        "starting_number_of_employees": 19800,
        "starting_worker_efficiency": 0.247,
        "starting_debt_allowed": True,
        "starting_demand_intercept": 3300.00,
        "starting_demand_slope": 0.01298,
    },
    IndustryType.HOUSEHOLD_GOODS: {
        "starting_price": 120.00,
        "starting_inventory": 260800,
        "starting_balance": 1651494.00,
        "starting_offered_wage": 1435.60,
        "starting_fixed_cost": 63519.00,
        "starting_raw_mat_cost": 48.00,
        "starting_number_of_employees": 6200,
        "starting_worker_efficiency": 0.263,
        "starting_debt_allowed": True,
        "starting_demand_intercept": 386.67,
        "starting_demand_slope": 0.00409,
    },
    IndustryType.ENTERTAINMENT: {
        "starting_price": 15.00,
        "starting_inventory": 815000,
        "starting_balance": 1321190.00,
        "starting_offered_wage": 2083.60,
        "starting_fixed_cost": 50815.00,
        "starting_raw_mat_cost": 4.13,
        "starting_number_of_employees": 22100,
        "starting_worker_efficiency": 0.230,
        "starting_debt_allowed": True,
        "starting_demand_intercept": 27.50,
        "starting_demand_slope": 0.000061,
    },
    IndustryType.LUXURY: {
        "starting_price": 1500.00,
        "starting_inventory": 3260,
        "starting_balance": 165152.00,
        "starting_offered_wage": 2153.40,
        "starting_fixed_cost": 6352.00,
        "starting_raw_mat_cost": 150.00,
        "starting_number_of_employees": 620,
        "starting_worker_efficiency": 0.033,
        "starting_debt_allowed": True,
        "starting_demand_intercept": 2500.00,
        "starting_demand_slope": 1.227,
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
        "price_cap": {
            itype.value: (
                0.000267 if itype.value == IndustryType.HOUSING else None
            )  # Annual: 1.4%
            for itype in IndustryType
        },
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
