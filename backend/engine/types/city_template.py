from enum import StrEnum


class CityTemplate(StrEnum):
    """
    An enumeration of the different city templates supported by the simulation.
    """

    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"

# TODO: Adjust based on research for templates.
CITY_TEMPLATES_SETTINGS = {
    CityTemplate.SMALL: {
        "num_people": 1000,
        "tax_rates": {
            "corporate_income_tax": {"default": 0.15},
            "personal_income_tax": 0.20,
            "sales_tax": {"default": 0.05},
            "property_tax": 0.015,
            "tariffs": {"default": 0.03},
        },
        "initial_unemployment_rate": 0.05,
        "overall_inflation_rate": 0.001,  # Weekly inflation
    },
    CityTemplate.MEDIUM: {
        "num_people": 10000,
        "tax_rates": {
            "corporate_income_tax": {"default": 0.20},
            "personal_income_tax": 0.25,
            "sales_tax": {"default": 0.06},
            "property_tax": 0.012,
            "tariffs": {"default": 0.04},
        },
        "initial_unemployment_rate": 0.04,
        "overall_inflation_rate": 0.0015,
    },
    CityTemplate.LARGE: {
        "num_people": 100000,
        "tax_rates": {
            "corporate_income_tax": {"default": 0.21},
            "personal_income_tax": 0.28,
            "sales_tax": {"default": 0.04},
            "property_tax": 0.01,
            "tariffs": {"default": 0.05},
        },
        "initial_unemployment_rate": 0.06,
        "overall_inflation_rate": 0.002,
    },
}
