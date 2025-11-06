# Backend Server

This directory will contain the logic for the FastAPI server and API endpoints.

## Structure

- [city_template](./city_template.py): the templates for a simulation.
- [main.py](./main.py): the REST API endpoints for the frontend to connect to.
- [websocket.py](./websocket.py): the websocket endpoints for the frontend to connect to.
- [dependencies.py](./dependencies.py): the dependencies for the FastAPI server (a ModelController).
- [run.py](./run.py): what actually runs the FastAPI server.

## Important Commands

Within the backend directory, assuming everything is up to date, one can run
`poetry run dev` to start the FastAPI server. FastAPI has an easy way to test the server by going to `docs` like this: [http://localhost:8000/docs](http://localhost:8000/docs) once it is running.

## City Templates

### Structure

**Cities**

The simulation uses three city-size templates, which are based on the real-world profiles of three representative U.S. cities.

* **Small (Columbia, MO):** Represents a smaller, education-centered economy with a lower cost of living and high car dependency.

* **Medium (Madison, WI):** Represents a balanced, mid-sized economy with a mix of public (government) and private (biotech) industry. It is noted as being walkable and bike-friendly.

* **Large (San Francisco, CA):** Represents a high-cost, high-inequality global city dominated by tech and finance. It has extensive public transit.

**Classes**

The model simplifies the complex U.S. class structure into three groups: `LOWER_CLASS`, `MIDDLE_CLASS`, and `UPPER_CLASS`. The proportional size of these classes is conceptually based on the *Pew Research Center's* definition, which classifies "middle-income" as households earning between two-thirds (2/3) and double (2x) the U.S. median household income. "Lower-income" falls below this, and "upper-income" falls above it.

### Modeling Population & Income

#### **Income Distribution: Log-Normal**

A standard normal distribution (bell curve) is a poor fit for income. Real-world income is heavily right-skewed, with a long tail of very-high-earners, as noted in our project docs. Therefore, we use a **Log-Normal Distribution** for all `income` and `balance` (savings) parameters.

Functions like `numpy.random.lognormal(mean, sd)` require parameters for the underlying logarithm of the variable.

* `mean` ($\mu$): This is the mean of the log of the income. The median of the final distribution is $e^\mu$. We can solve for $\mu$ using $\mu = \ln(\text{median\_income})$. This is more robust than using the arithmetic mean, which is skewed by outliers.

* `sd` ($\sigma$): This is the standard deviation of the log of the income. It directly controls the inequality or spread of the distribution. A higher $\sigma$ means a wider, more unequal class.

#### **Parameter Derivation by City**

**Proportion**

* **Small (Columbia):** `L: 0.35, M: 0.50, U: 0.15`

    * *Reasoning*: Based on Columbia's high poverty rate (~22%), we model a larger-than-average `LOWER_CLASS`.

* **Medium (Madison):** `L: 0.30, M: 0.55, U: 0.15`

    * *Reasoning*: Reflects a "balanced" economy  with a robust middle class, closely mirroring the Pew-defined national average.

* **Large (San Francisco):** `L: 0.35, M: 0.40, U: 0.25`

    * *Reasoning*: Models a "hollowed-out" middle class, characteristic of high-inequality cities. The high cost of living pushes more people into the `LOWER_CLASS`, while the high-tech/finance economy creates a larger `UPPER_CLASS`.


**Income**

The `mean` ($\mu$) is derived by taking the city's median income, calculating the median for each class based on the Pew definition, converting it to a *weekly* figure (as the simulation runs week-by-week 12), and finally taking the natural log ($\ln$).

The `sd` ($\sigma$) is a manually-tuned parameter representing within-class inequality.

* `LOWER_CLASS` ($\sigma=0.40$): Moderately high variance.

* `MIDDLE_CLASS` ($\sigma=0.30$): The tightest, most "average" group.

* `UPPER_CLASS` ($\sigma=0.60$): Very high variance to model the vast spread from "well-off" to "ultra-rich."

The `mean` and `sd` was calculated by hand for each group, using the following example:

Small (Columbia, MO): Median Income: ~$57,000/yr

* `LOWER_CLASS`: $\mu = \ln( (\$57,000 \times 0.50) / 52 ) = \ln(548) \approx$ **6.31**

* `MIDDLE_CLASS`: $\mu = \ln( \$57,000 / 52 ) = \ln(1096) \approx$ **7.00**

* `UPPER_CLASS`: $\mu = \ln( (\$57,000 \times 2.5) / 52 ) = \ln(2740) \approx$ **7.92**


**Savings** (`balance`)

This parameter also uses a log-normal distribution, as savings are similarly right-skewed. The `mean` values (`6.0`, `8.5`, `11.0`, etc.) are *relative representations* of low, medium, and high savings balances, not tied to a specific dollar median. The `sd` values control the spread of savings within each class.


### Modeling Spending Behavior

#### Guiding Principles & Data

* **Primary Source:** All baseline spending proportions are derived from the **U.S. Bureau of Labor Statistics (BLS) Consumer Expenditure Survey (CEX)** (2023 data).

* **Economic Principle:** We follow **Engel's Law**, which states that as income rises, the *proportion* of income spent on necessities (especially food) *decreases*, while the *proportion* spent on discretionary items (luxury, entertainment) *increases*.

* **City-Specific Adjustments:** We use a "crowding out" model. When a mandatory, inelastic cost (like `HOUSING`) increases due to local market conditions, that cost must "crowd out" (i.e., reduce the proportion of) more elastic, discretionary categories like `LUXURY` and `ENTERTAINMENT`.

    * **TODO**: How can we make it so that `PersonAgent`s are making the decisions of how to spend their money in other places due to rising housing costs, etc. Currently, they are spending a percentage of thei budget on housing, but there is no minimum!

#### Category Mapping

Mapped `IndustryType` categories to the CEX data as follows:

* `GROCERIES`: Mapped to BLS "Food at home".

* `AUTOMOBILES`: Mapped to BLS "Transportation".

* `ENTERTAINMENT`: Mapped to BLS "Entertainment".

* `HOUSING`, `UTILITIES`, `HOUSEHOLD_GOODS`: These three are a disaggregation of the total BLS "Housing" category. We split this total using a 65% (Shelter), 25% (Utilities), 10% (Goods) ratio, based on CEX sub-tables.

* `LUXURY`: This is a non-BLS proxy category for high-discretionary spending, created by summing: "Food away from home," "Apparel and services," "Alcoholic beverages," and "Personal care products".

#### Spending Profile Derivation (by city)

Based on the above mappings, here is the **national baseline**:

| Class | `HOUSING` | `GROCERIES` | `AUTOMOBILES` | `ENTERTAINMENT` | `LUXURY` |
|-------|---------|-----------|-------------|---------------|--------|
| Lower | 35.5%   | 9.0%      | 15.0%       | 4.0%          | 12.0%  |
| Middle| 33.0%   | 7.5%      | 17.0%       | 5.0%          | 15.5%  |
| Upper | 31.0%   | 6.0%      | 16.0%       | 6.0%          | 20.0%  |

*(Note: These rows do not sum to 1.00 because they exclude other CEX categories like healthcare, education, and insurance, which our model does not include in `spending_behavior`.)*

After establishing this baseline, we adjusted it for each city's unique profile.

* **Small (Columbia, MO):** Housing costs are ~20% lower than the national average. This frees up budget. Transportation is noted as "primarily car-dependent", so we increased its share.

* Medium (Madison, WI): Housing costs are slightly higher (~6-8%) than the national average. The city is "walkable", implying a lower transportation share.

* Large (San Francisco, CA): Housing costs are dramatically higher (~160%+) than the national average. As a result, `HOUSING` proportions are the highest, severely "crowding out" `LUXURY` and `ENTERTAINMENT` for the Lower and Middle classes. "Extensive public transit"  implies a significantly lower `AUTOMOBILES` share. 