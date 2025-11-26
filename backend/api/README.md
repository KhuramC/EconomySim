# Backend Server

This directory will contain the logic for the FastAPI server and API endpoints.

## Structure

- [city_template](./city_template.py): the templates for a simulation.
- [main.py](./main.py): the middleware for what can connect to the server.
- [rest.py](./rest.py): the REST API endpoints for the frontend to connect to.
- [websocket.py](./websocket.py): the WebSocket endpoints for the frontend to connect to.
- [dependencies.py](./dependencies.py): the dependencies for the FastAPI server.
- [run.py](./run.py): what actually runs the FastAPI server.

## Important Commands

Within the backend directory, assuming everything is up to date, one can run
`poetry run dev` to start the FastAPI server. FastAPI has an easy way to test the server by going to `docs` like this: [http://localhost:8000/docs](http://localhost:8000/docs) once it is running.

# City Templates

## Structure

### Cities

The simulation uses three city-size templates, which are based on the real-world profiles of three representative U.S. cities.

- **Small (Columbia, MO):** Represents a smaller, education-centered economy with a lower cost of living and high car dependency.

- **Medium (Madison, WI):** Represents a balanced, mid-sized economy with a mix of public (government) and private (biotech) industry. It is noted as being walkable and bike-friendly.

- **Large (San Francisco, CA):** Represents a high-cost, high-inequality global city dominated by tech and finance. It has extensive public transit.

### Classes

The model simplifies the complex U.S. class structure into three groups: `LOWER_CLASS`, `MIDDLE_CLASS`, and `UPPER_CLASS`. The proportional size of these classes is conceptually based on the _Pew Research Center's_ definition, which classifies "middle-income" as households earning between two-thirds (2/3) and double (2x) the U.S. median household income. "Lower-income" falls below this, and "upper-income" falls above it.

## **Population**

### Income Distribution: Log-Normal

A standard normal distribution (bell curve) is a poor fit for income. Real-world income is heavily right-skewed, with a long tail of very-high-earners, as noted in our project docs. Therefore, we use a **Log-Normal Distribution** for all `income` and `balance` (savings) parameters.

Functions like `numpy.random.lognormal(mean, sd)` require parameters for the underlying logarithm of the variable.

- `mean` ($\mu$): This is the mean of the log of the income. The median of the final distribution is $e^\mu$. We can solve for $\mu$ using $\mu = \ln(\text{median\_income})$. This is more robust than using the arithmetic mean, which is skewed by outliers.

- `sd` ($\sigma$): This is the standard deviation of the log of the income. It directly controls the inequality or spread of the distribution. A higher $\sigma$ means a wider, more unequal class.

### Parameter Derivation by City

**Proportion**

- **Small (Columbia):** `L: 0.35, M: 0.50, U: 0.15`

  - _Reasoning_: Based on Columbia's high poverty rate (~22%), we model a larger-than-average `LOWER_CLASS`.

- **Medium (Madison):** `L: 0.30, M: 0.55, U: 0.15`

  - _Reasoning_: Reflects a "balanced" economy with a robust middle class, closely mirroring the Pew-defined national average.

- **Large (San Francisco):** `L: 0.35, M: 0.40, U: 0.25`

  - _Reasoning_: Models a "hollowed-out" middle class, characteristic of high-inequality cities. The high cost of living pushes more people into the `LOWER_CLASS`, while the high-tech/finance economy creates a larger `UPPER_CLASS`.

**Income**

The `mean` ($\mu$) is derived by taking the city's median income, calculating the median for each class based on the Pew definition, converting it to a _weekly_ figure (as the simulation runs week-by-week 12), and finally taking the natural log ($\ln$).

The `sd` ($\sigma$) is a manually-tuned parameter representing within-class inequality.

- `LOWER_CLASS` ($\sigma=0.40$): Moderately high variance.

- `MIDDLE_CLASS` ($\sigma=0.30$): The tightest, most "average" group.

- `UPPER_CLASS` ($\sigma=0.60$): Very high variance to model the vast spread from "well-off" to "ultra-rich."

The `mean` and `sd` was calculated by hand for each group, using the following example:

Small (Columbia, MO): Median Income: ~$57,000/yr

- `LOWER_CLASS`: $\mu = \ln( (\$57,000 \times 0.50) / 52 ) = \ln(548) \approx$ **6.31**

- `MIDDLE_CLASS`: $\mu = \ln( \$57,000 / 52 ) = \ln(1096) \approx$ **7.00**

- `UPPER_CLASS`: $\mu = \ln( (\$57,000 \times 2.5) / 52 ) = \ln(2740) \approx$ **7.92**

**Starting Account Balance** (`balance`)

This parameter adjusts the cash balances each `PersonAgent` begins the simulation with. It also uses a lognormal distribution, as a population's savings are similarly right-skewed. The input values (`6.0`, `8.5`, `11.0`, etc.) are for the `mean` of the lognormal distribution function, and are _relative representations_ of low, medium, and high savings balances, not tied to a specific dollar median. The `sd` values control the spread of savings within each class.

_Note: This values may seem low, but they scale drastically under lognormal distribution._

### Modeling Spending Behavior

### Guiding Principles & Data

- **Primary Source:** All baseline spending proportions are derived from the **U.S. Bureau of Labor Statistics (BLS) Consumer Expenditure Survey (CEX)** (2023 data).

- **Economic Principle:** We follow **Engel's Law**, which states that as income rises, the _proportion_ of income spent on necessities (especially food) _decreases_, while the _proportion_ spent on discretionary items (luxury, entertainment) _increases_.

- **City-Specific Adjustments:** We use a "crowding out" model. When a mandatory, inelastic cost (like `HOUSING`) increases due to local market conditions, that cost must "crowd out" (i.e., reduce the proportion of) more elastic, discretionary categories like `LUXURY` and `ENTERTAINMENT`.

  - **TODO**: How can we make it so that `PersonAgent`s are making the decisions of how to spend their money in other places due to rising housing costs, etc. Currently, they are spending a percentage of thei budget on housing, but there is no minimum!

### Category Mapping

Mapped `IndustryType` categories to the CEX data as follows:

- `GROCERIES`: Mapped to BLS "Food at home".

- `AUTOMOBILES`: Mapped to BLS "Transportation".

- `ENTERTAINMENT`: Mapped to BLS "Entertainment".

- `HOUSING`, `UTILITIES`, `HOUSEHOLD_GOODS`: These three are a disaggregation of the total BLS "Housing" category. We split this total using a 65% (Shelter), 25% (Utilities), 10% (Goods) ratio, based on CEX sub-tables.

- `LUXURY`: This is a non-BLS proxy category for high-discretionary spending, created by summing: "Food away from home," "Apparel and services," "Alcoholic beverages," and "Personal care products".

### Spending Profile Derivation (by city)

Based on the above mappings, here is the **national baseline**:

| Class  | `HOUSING` | `GROCERIES` | `AUTOMOBILES` | `ENTERTAINMENT` | `LUXURY` |
| ------ | --------- | ----------- | ------------- | --------------- | -------- |
| Lower  | 35.5%     | 9.0%        | 15.0%         | 4.0%            | 12.0%    |
| Middle | 33.0%     | 7.5%        | 17.0%         | 5.0%            | 15.5%    |
| Upper  | 31.0%     | 6.0%        | 16.0%         | 6.0%            | 20.0%    |

_(Note: These rows do not sum to 1.00 because they exclude other CEX categories like healthcare, education, and insurance, which our model does not include in `spending_behavior`.)_

After establishing this baseline, we adjusted it for each city's unique profile.

- **Small (Columbia, MO):** Housing costs are ~20% lower than the national average. This frees up budget. Transportation is noted as "primarily car-dependent", so we increased its share.

- **Medium (Madison, WI):** Housing costs are slightly higher (~6-8%) than the national average. The city is "walkable", implying a lower transportation share.

- **Large (San Francisco, CA):** Housing costs are dramatically higher (~160%+) than the national average. As a result, `HOUSING` proportions are the highest, severely "crowding out" `LUXURY` and `ENTERTAINMENT` for the Lower and Middle classes. "Extensive public transit" implies a significantly lower `AUTOMOBILES` share.

## **Policies**

The `policies` dictionary establishes the starting parameters for the simulation. The values are not arbitrary; they are based on data-driven research into the municipal, county, state, and federal laws governing our three model cities: Columbia, MO (Small); Madison, WI (Medium); and San Francisco, CA (Large).

**Core Design Decision: Weekly Compounding Rates**

The simulation operates on a _weekly_ time step. To ensure financial accuracy, all annual percentage rates (APRs) for taxes and rent caps have been converted into weekly compounding rates. This prevents the simulation from merely dividing an annual rate by 52, which is mathematically incorrect for compounding effects.

The formula used for this conversion is: $weekly\_rate = (1 + annual\_rate)^{(1/52)} - 1$

### Corporate Income Tax

This policy is defined as a dictionary mapping each `IndustryType` to a flat tax rate applied to its profits. Research confirms this is a **state-level tax** with a flat rate, not a progressive one. Therefore, all industries within a given city preset share the same rate.

**City-Specific Values (2025):**

- **Small (Columbia): 4.0%.** Missouri has one of the lowest corporate tax rates in the nation.

- **Medium (Madison): 7.9%.** This is Wisconsin's flat corporate income and franchise tax rate.

- **Large (San Francisco): 8.84%.** This is California's general corporate tax rate.

### Personal Income Tax

This policy is modeled as a progressive bracket system, per the simulation's design. It is implemented as a list of dictionaries: `(threshold(weekly income), rate(weekly compounding))`. The simulation applies these rates to agent income. This is a **state-level tax**.

**City-Specific Values (2025):**

- **Small (Columbia):** An 8-bracket progressive system. The thresholds and rates are derived from Missouri's 2025 tax tables.

  - _Note on Low Threshold: The top bracket of **4.7%** applying to all annual income over **$9,191** is correct. This is a "compressed" system, a deliberate state policy to move toward a flatter tax structure. In the simulation, this functions as a de facto flat tax for all agents except the very lowest earners._

- **Medium (Madison):** A 4-bracket progressive system based on Wisconsin's 2025 tables. The top rate is **7.65%** on income over **$315,310**.

- **Large (San Francisco):** A 9-bracket, highly progressive system based on California's 2025 tables. The top rate is **12.3%** on income over **$721,314**.

### Sales Tax

This policy is a dictionary mapping `IndustryType` to a weekly compounding rate. Research revealed a critical, non-negotiable distinction in all three states: food/groceries are taxed differently than general merchandise. The simulation must reflect this.

**City-Specific Values (2025):**

- **Small (Columbia):**

  - General Rate: **7.975%** (a combination of 4.225% state + 1.75% county + 2.0% city).

  - Food/Grocery Rate: **4.975%** (Missouri's state rate is reduced to 1.225% for food, but local taxes still apply).

- **Medium (Madison):**

  - General Rate: **5.5%** (5.0% state + 0.5% Dane County).

  - Food/Grocery Rate: **0.0%** (Most food for home consumption is exempt in Wisconsin).

- **Large (San Francisco):**

  - General Rate: **8.625%** (7.25% state + 1.375% city/county).

  - Food/Grocery Rate: **0.0%** (Most food for home consumption is exempt in California).

### Property Tax

This policy was changed from a fixed dollar amount to a **weekly compounding effective percentage** to better integrate with the simulation's logic. Research shows that commercial and residential properties are often assessed at different rates. The policy is a dictionary with "residential" and "commercial" keys.

**City-Specific Values (2025):**

- **Small (Columbia):**

  - Residential: **0.92%** (This is the average effective rate on market value for Boone County).

  - Commercial: **2.159%** (This is derived from the official assessment ratio of 32% for commercial property multiplied by the local levy of 6.7462% ).

- **Medium (Madison):**

  - Residential: **1.78%** (This is the average effective rate for Dane County, which assesses property at 100% of market value).

  - Commercial: **1.78%** (The effective rate is applied to both classes).

- **Large (San Francisco):**

  - Residential: **0.66%** (This is the average effective rate in San Francisco County. Due to Proposition 13, this is much lower than the 1.18% levy rate a new buyer would pay, as it accounts for long-time owners with lower assessed values).

  - Commercial: **0.66%** (The same effective rate is used for commercial properties).

### Tariffs

This policy represents a **percentage markup on the cost of imported raw materials** for a given industry. As a federal policy, the rates are identical across all three cities. The values are based on the 2025 high-tariff environment, with an average effective rate around 18%. Rates are applied as percentages.

**Industry-Specific Values (2025):**

- `GROCERIES`: **25%** (Rate for non-USMCA food imports).

- `UTILITIES`: **0.0%** (Considered a domestic, non-imported service).

- `AUTOMOBILES`: **25%** (Baseline tariff on imported automobiles).

- `HOUSING`: **10%** (Based on new tariffs applied to timber, lumber, and wood products).

- `HOUSEHOLD_GOODS`: **25%** (Based on tariffs applied to furniture and cabinets).

- `ENTERTAINMENT`: **0.0%** (Considered a domestic service).

- `LUXURY`: **10%** (Based on the baseline "reciprocal" tariff and rates for electronics, which serve as a proxy for luxury goods).

### Subsidies

This policy functions as the inverse effect of tariffs on an Industry. Instead of adding a percentage increase to a raw material cost, a subsidy will subtract a percentage of the cost from a material good. This will act as the government incentivizing the growth and production of an industry.

**Some City Specific Research (2025):**

- **Small (Columbia):** Targets Manufacturing and R&D, based on programs like "Missouri Works" and the "BUILD" Program.

- **Medium (Madison):** Targets Manufacturing and Food/Groceries, based on the state's "Manufacturing and Agriculture Credit (MAC)" and "Food processing... credit".

- **Large (San Francisco):** Targets Technology, Manufacturing, Film/Entertainment, and Food/Groceries, based on the "California Competes Tax Credit (CCTC)" and "CAEATFA" programs

### Rent Cap

This policy is a float representing the maximum weekly compounding rent increase the `HOUSING` industry can apply.

**City-Specific Values (2025):**

- **Small (Columbia): 0.0.** There are no state or local rent control laws in Missouri.

- **Medium (Madison): 0.0.** Wisconsin state law explicitly prohibits municipalities from enacting rent control.

- **Large (San Francisco): 0.000267** (This is the weekly compounding equivalent of the 1.4% annual increase allowed from March 1, 2025, to February 28, 2026, under the city's Rent Ordinance).

### Minimum Wage

This policy is a float representing the legal **total weekly minimum wage**, assuming a 40-hour work week. The corresponding hourly rate is noted in the comments.

**City-Specific Values (2025):**

- **Small (Columbia): $550.00** (Based on the Missouri state minimum wage of $13.75/hour effective Jan 1, 2025).

- **Medium (Madison): $290.00** (Based on the Wisconsin state minimum wage, which defaults to the federal minimum of $7.25/hour).

- **Large (San Francisco): $767.20** (Based on the city's local minimum wage ordinance of $19.18/hour effective July 1, 2025).

## **Industry**

Industry parameters define the starting economic conditions for the seven representative industry agents within the simulation.1 These values are calibrated from real-world economic data corresponding to each city template (Columbia, MO; Madison, WI; San Francisco, CA) to ensure a realistic and data-driven simulation.

### `starting_price`

The initial price for one unit of the industry's goods or services. This value is calibrated using localized consumer price data for each city template.

- **GROCERIES**: Derived from average monthly grocery costs for a renter, normalized to a weekly, per-person "unit".

- **UTILITIES**: Derived from the average monthly residential electricity/energy bill in each city.

- **AUTOMOBILES**: Based on the average price of a used car in the region, as this is a high-cost, low-frequency purchase.

- **HOUSING**: Represents one week's rent. Derived from the average monthly rent for a 1-bedroom apartment in each city.

- **ENTERTAINMENT**: Based on the average price of a movie ticket (a representative entertainment unit) in or near the city.

- **HOUSEHOLD_GOODS**: A blended, assumed price for a representative basket of goods (e.g., decor, small appliances), scaled by the city's general cost of living.

- **LUXURY**: An assumed national-level price for a representative high-end good (e.g., handbag, watch).

### `starting_offered_wage`

The weekly wage offered to employees. This parameter is data-driven, based on the U.S. Bureau of Labor Statistics (BLS) Mean Hourly Wage for the most relevant "Major Occupational Group" in each metropolitan area.

- **Formula**: `starting_offered_wage` = (Mean Hourly Wage $\times$ 40 hours).

- **GROCERIES, AUTOMOBILES, HOUSEHOLD_GOODS**: Mapped to "Sales and related" occupations.

- **UTILITIES**: Mapped to "Installation, maintenance, and repair" occupations.

- **HOUSING**: Mapped to "Property, Real Estate, and Community Association Managers" or "Real estate sales agents".

- **ENTERTAINMENT**: Mapped to "Arts, design, entertainment, sports, and media" occupations.

- **LUXURY**: Mapped to "Sales and related" occupations but with a 50% "efficiency wage" premium, modeling the industry's tendency to pay above-market rates.

### `starting_number_of_employees`

Represents the total employment for that industry's NAICS sector within the city's county. This reflects the IndustryAgent's role as a monopolistic representative for the entire sector.

- Data is sourced from county-level employment statistics

- **Data Gap Mitigation**: For sectors where local data is unavailable (e.g., Utilities in Columbia), employment is estimated using a per-capita employment ratio derived from a data-rich city (San Francisco) and applied to the target city's population.

- **NAICS Disaggregation**: "Retail Trade" (NAICS 44-45) employment is disaggregated to serve multiple agents using a research-justified allocation:

  - GROCERIES (NAICS 4451): 20%
  - AUTOMOBILES (NAICS 441): 15%
  - HOUSEHOLD_GOODS (NAICS 442): 10%
  - LUXURY (high-end retail): 1%

### `starting_worker_efficiency`

This is a balancing parameter, not directly researched. It is derived to ensure the agent's labor force (`starting_number_of_employees`) can meet the city's weekly demand (Q_demand) when working a 40-hour week.

**Formula**: `worker_efficiency` = $\frac{Q_{\text{demand}}}{(\text{starting\_number\_of\_employees} \times 40 \text{ hours})}$

**Post-Research Calibration: Balancing Population and Employment**

The initial data for `starting_number_of_employees` was sourced from real-world, county-level NAICS statistics. This created a logical discrepancy with the abstract num_people (e.g., 1000, 10000) chosen for the simulation.

To ensure the simulation starts in a balanced state with a 1:1 ratio of `PersonAgent` to available job (as agents do not currently support holding multiple jobs), a calibration pass was performed. Two different methods were used:

1. Small & Medium Cities (Employee Scaling)

For the Small (num_people: 1000) and Medium (num_people: 10000) templates, the priority was to maintain the abstract population counts.

- `starting_number_of_employees`: The total sourced employment data was scaled down proportionally to match the target num_people

- `starting_worker_efficiency`: Because the workforce was made smaller, the `starting_worker_efficiency` had to be recalculated (increased) to ensure this smaller workforce could still produce the original, research-based weekly `Q_demand`. The formula `worker_efficiency` = `Q_demand / (scaled_employees * 40)` was used.

2. Large City (Population Scaling)

For the Large template, the priority was to maintain the integrity of the original, research-based economic parameters (Q_demand, starting_worker_efficiency, etc.).

- `num_people`: The `num_people` parameter was adjusted down from its conceptual 100,000 to **75,220**.

- `starting_number_of_employees`: This new population (75,220) now perfectly matches the total original sourced employment data.

- `starting_worker_efficiency`: Because the original employee and `Q_demand` figures were kept, the original `starting_worker_efficiency` value remains unchanged and valid.

### `starting_raw_mat_cost`

The variable cost (or Cost of Goods Sold - COGS) to produce one unit. It is derived from the `starting_price` and typical gross margin data for that industry.

- **Formula**: `starting_raw_mat_cost` = `starting_price` $\times$ (1 - Gross Margin %)

- **GROCERIES**: ~68% COGS.

- **UTILITIES**: ~21% variable (fuel) cost.

- **AUTOMOBILES**: ~90% COGS (blended new/used).

- **HOUSING**: ~5% variable cost (management, turnover).

- **HOUSEHOLD_GOODS**: ~40% COGS (60% margin).

- **ENTERTAINMENT**: ~27.5% blended COGS (derived from ticket 112 and concession 113 margins).

- **LUXURY**: ~10% COGS (90% margin).

### `starting_fixed_cost`

The weekly non-variable costs, primarily commercial real estate. This is derived from city-specific commercial lease rates (per square foot per year) for a representative facility size.

**Exceptions:**

- **UTILITIES**: Fixed costs are derived algebraically to satisfy the Average Cost Pricing model specified in the Agent Behavior research, ensuring zero economic profit at initialization.

- **HOUSING**: Fixed costs (representing capital assets) are derived algebraically to achieve a target net profit margin (e.g., 10%) under the Profit Maximization model.

### `starting_demand_intercept` (A) and `starting_demand_slope` (B)

These parameters define the agent's linear demand curve ($Price = A - BQ$). They are not set manually; they are derived algebraically using the `starting_price`, an estimated weekly quantity demanded (`Q_demand`), and the Price Elasticity of Demand (PED) for that good.

- `Q_demand` **(Weekly Quantity)**: Estimated based on city population 1 and purchase frequency assumptions (e.g., 1 grocery unit per person/week; 1 car unit per household every 8 years).

- `PED` **(Price Elasticity of Demand)**: Sourced from economic literature.

  - **GROCERIES**: Inelastic (PED $\approx -0.60$).
  - **UTILITIES**: Highly Inelastic (PED $\approx -0.13$).
  - **AUTOMOBILES**: Unit Elastic (PED $\approx -1.0$).
  - **HOUSING**: Highly Inelastic (PED $\approx -0.30$).
  - **HOUSEHOLD_GOODS**: Inelastic (PED $\approx -0.45$).
  - **ENTERTAINMENT**: Elastic (PED $\approx -1.20$).
  - **LUXURY**: Highly Elastic (PED $\approx -1.50$).

- **Formulas**:

  - `starting_demand_slope` ($B$) = $\frac{-P}{(Q \times PED)}$

  - `starting_demand_intercept` ($A$) = $P + (B \times Q)$

### `starting_inventory`

Modeled as a 4-week buffer of production to ensure the agent can meet initial demand.

**Formula**: `starting_inventory` = $Q_{\text{demand}} \times 4$

### `starting_balance` (Savings/debt)

Modeled as a 6-month (26-week) capital reserve to ensure the agent can cover its starting_fixed_cost and initial payroll.

**Formula**: `starting_balance` = `starting_fixed_cost` $\times 26$

### `starting_debt_allowed`

Set to True per the IndustryAgent class default, allowing firms to operate at a deficit.

## Cited Research

### Population

[1.1] Pew Research Center. (2022). "How the American Middle Class Has Changed."

[2.1] Gibrat, R. (1931). "Les Inégalités Économiques." (Gibrat's Law on log-normal distribution of income).

[3.1] U.S. Bureau of Labor Statistics. (2024). "Consumer Expenditure Survey, 2023 - Table 1." (Average expenditures by income quintile).

[3.2] U.S. Bureau of Labor Statistics. (2024). "Consumer Expenditure Survey, 2023 - Table 1101." (Detailed expenditures on housing, food, and apparel).

[4.1] Houthakker, H. S. (1957). "An International Comparison of Household Expenditure Patterns, Commemorating the Centenary of Engel's Law." Econometrica.

[5.1] Council for Community and Economic Research (C2ER). (2024). "Cost of Living Index - Columbia, MO."

[5.2] U.S. Department of Agriculture. (2024). "Gas Prices by State - Missouri."

[6.1] Council for Community and Economic Research (C2ER). (2024). "Cost of Living Index - Madison, WI."

[6.2] Wisconsin REALTORS Association. (2024). "Monthly Housing Market Report."

[7.1] Council for Community and Economic Research (C2ER). (2024). "Cost of Living Index - San Francisco, CA."

### Policies

**Corporate Income Tax**

Missouri Department of Revenue. (2025). "Corporation Income Tax."

Tax Foundation. (2025). "Wisconsin State Tax Data."

California Franchise Tax Board. (2025). "Tax rates by entity."

**Personal Income Tax**

Missouri Department of Revenue. (2025). "2025 Tax Year Changes - Indexed for Inflation."

Tax Foundation. (2024). "Missouri Considers Path to Flat Income Tax."

AARP. (2025). "Wisconsin State Taxes Guide."

NerdWallet. (2025). "California State Tax Rates."

**Sales Tax**

Zamp. (2025). "Columbia Missouri Sales Tax."

Missouri Department of Revenue. (2025). "Sales Tax Reduction on Food."

Kintsugi. (2025). "Madison Wisconsin Sales Tax Guide."

Wisconsin Administrative Code. (2025). "Tax 11.51 - Grocers' guidelist."

Quaderno. (2025). "San Francisco Sales Tax Guide for Businesses in 2025."

Kintsugi. (2025). "California Non-Taxable Food Items and Grocery Tax Exemptions."

**Property Tax**

City of Columbia, Missouri. (2025). "2025 Property Tax Comparison Report."

City of Madison. (2025). "2025 Property Tax Base of the City of Madison."

SmartAsset. (2025). "Wisconsin Property Tax Calculator - Dane County."

San Francisco Treasurer. (2025). "Secured Property Taxes."

SmartAsset. (2025). "California Property Tax Calculator - San Francisco County."

**Tariffs**

Yale Budget Lab. (2025). "The State of U.S. Tariffs."

U.S. Presidential Proclamation. (2025). "Adjusting Imports of Automobiles and Automobile Parts."

National Association of Home Builders (NAHB). (2025). "New Tariffs on Lumber, Wood Product Imports."

U.S. White House. (2025). "Fact Sheet: U.S.-China Trade and Economic Deal."

**Subsidies**

Missouri Department of Economic Development. (2025). "Missouri Works Program."

The New North. (2025). "Wisconsin Tax Credits and Special Program Incentives."

State of California (GO-Biz). (2025). "California Competes Tax Credit (CCTC)."

**Rent Cap**

City of Columbia, Missouri. (2016). "Landlord-Tenant Law Guidelines."

Tenant Resource Center. (2023). "Raising the Rent."

City and County of San Francisco. (2025). "Learn about rent increases in San Francisco."

**Minimum Wage**

Missouri Department of Labor. (2025). "Minimum Wage Increases to $13.75 per Hour for 2025."

ToastTab. (2025). "Wisconsin Minimum Wage Guide 2025."

City and County of San Francisco. (2025). "Official Notice: Minimum Wage Ordinance (July 1, 2025)."

### Industry

Columbia, MO - May 2023 OEWS Metropolitan and Nonmetropolitan ..., accessed November 7, 2025, https://www.bls.gov/oes/2023/may/oes_17860.htm

Occupational Employment and Wages in Madison — May 2024 ..., accessed November 7, 2025, https://www.bls.gov/regions/midwest/news-release/occupationalemploymentandwages_madison.htm

Occupational Employment and Wages in San Francisco-Oakland ..., accessed November 7, 2025, https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_sanfrancisco.htm
Boone County, MO | Data USA, accessed November 7, 2025, https://datausa.io/profile/geo/boone-county-mo

Boone County and the City of Columbia Housing Study, accessed November 7, 2025, https://www.como.gov/wp-content/uploads/2024/10/boone-county-columbia-housing-study.pdf

Employment by Industry Data - Labor Market Information - CA.gov, accessed November 7, 2025, https://labormarketinfo.edd.ca.gov/data/employment-by-industry.html

10 Grocery Store Industry Financial Statistics: Sales, Expenses, Profit and More, accessed November 7, 2025, https://www.projectionhub.com/post/grocery-store-industry-financial-statistics
accessed November 7, 2025, https://www.fortnightly.com/fortnightly/2015/12-0/electricitys-variable-cost-all-time-low-percentage#:~:text=Revenues%20from%20the%20sale%20of%20electricity%20were%20393%20billion.,approximately%2021%20percent%20of%20revenues.

Electricity's Variable Cost All-Time Low Percentage? - Fortnightly, accessed November 7, 2025, https://www.fortnightly.com/fortnightly/2015/12-0/electricitys-variable-cost-all-time-low-percentage

How Much Profit Does a Car Dealership Make? | Used Car Dealer Profit Margin | ACV Auctions, accessed November 7, 2025, https://www.acvauctions.com/blog/car-dealership-profit-margin

How profitable are car dealerships? - BusinessDojo, accessed November 7, 2025, https://dojobusiness.com/blogs/news/how-profitable-are-car-dealerships

Variable Costs Explained - Re-Leased, accessed November 7, 2025, https://www.re-leased.com/terms/variable-costs

Variable Costs - Glossary of CRE Terms, accessed November 7, 2025, https://www.adventuresincre.com/glossary/variable-costs/

What is the profit margin of a home goods store? - BusinessDojo, accessed November 7, 2025, https://dojobusiness.com/blogs/news/home-goods-store-profit-margin

10 The economics of the operation - Independent Cinema Office, accessed November 7, 2025, https://www.independentcinemaoffice.org.uk/advice-support/how-to-start-a-cinema/the-economics-of-the-operation/

Can someone explain me about theaters cut and how much a movie actually makes? : r/boxoffice - Reddit, accessed November 7, 2025, https://www.reddit.com/r/boxoffice/comments/1iyc3l3/can_someone_explain_me_about_theaters_cut_and_how/

A Study of Luxury Companies — Recurve Capital LLC, accessed November 7, 2025, https://recurvecap.com/insights/a-study-of-luxury-companies

Mid Missouri Listings | Maly Commercial Realty: Commercial Real Estate Columbia MO, accessed November 7, 2025, https://malyrealty.com/mid-missouri-listings/

Listings - Madison - Key Commercial Real Estate, accessed November 7, 2025, https://keycomre.com/listings/

San Francisco Office Rent Price & Sales Report - Commercial Cafe, accessed November 7, 2025, https://www.commercialcafe.com/office-market-trends/us/ca/san-francisco/

Average Rental Price in Columbia, MO - Zillow, accessed November 7, 2025, https://www.zillow.com/rental-manager/market-trends/columbia-mo/

Average Rental Price in Madison, WI - Zillow, accessed November 7, 2025, https://www.zillow.com/rental-manager/market-trends/madison-wi/

Average Rent in San Francisco, CA - Latest Rent Prices by Neighborhood - Apartments.com, accessed November 7, 2025, https://www.apartments.com/rent-market-trends/san-francisco-ca/

Electricity Cost in Columbia, MO: 2025 Electric Rates | EnergySage, accessed November 7, 2025, https://www.energysage.com/local-data/electricity-cost/mo/boone-county/columbia/

Electricity Cost in Madison, WI: 2025 Electric Rates - EnergySage, accessed November 7, 2025, https://www.energysage.com/local-data/electricity-cost/wi/dane-county/madison/

Cost of electricity in San Francisco County, CA - EnergySage, accessed November 7, 2025, https://www.energysage.com/local-data/electricity-cost/ca/san-francisco-county/
accessed November 7, 2025, https://pmc.ncbi.nlm.nih.gov/articles/PMC2804646/#:~:text=Considerable%20data%20are%20available%20on,most%20inelastic%20demand%20for%20eggs.

Price Elasticity for Energy Use in Buildings in the United States - EIA, accessed November 7, 2025, https://www.eia.gov/analysis/studies/buildings/energyuse/pdf/price_elasticities.pdf

Price Elasticity of Demand - Harvard University, accessed November 7, 2025, https://scholar.harvard.edu/files/alada/files/price_elasticity_of_demand_handout.pdf

An Analysis of the Price Elasticity of Demand for Household Appliances - eScholarship, accessed November 7, 2025, https://escholarship.org/uc/item/5qr2f2nz

Price Elasticity and Substitutes Create Less Movie Going - Econlife, accessed November 7, 2025, https://econlife.com/2014/03/price-elasticity-and-substitutes-diminish-movie-goers/

5 Price Elasticity of Demand Examples - Symson, accessed November 7, 2025, https://www.symson.com/blog/price-elasticity-of-demand-examples

What is the Price Elasticity of Housing Demand? - Eric A. Hanushek, accessed November 7, 2025, https://hanushek.stanford.edu/sites/default/files/publications/Hanushek+Quigley%201980%20REStat%2062(3)_0.pdf

The Impact of Food Prices on Consumption: A Systematic Review of Research on the Price Elasticity of Demand for Food - NIH, accessed November 7, 2025, https://pmc.ncbi.nlm.nih.gov/articles/PMC2804646/

How elastic is housing demand? : r/AskEconomics - Reddit, accessed November 7, 2025, https://www.reddit.com/r/AskEconomics/comments/1f5y0wl/how_elastic_is_housing_demand/

Estimating Price Elasticity using Market-Level Appliance Data | Energy Technologies Area, accessed November 7, 2025, https://eta.lbl.gov/publications/estimating-price-elasticity-using

From movie to event theatre – Assessing the value of a cinema ticket. - Centre des Professions Financières |, accessed November 7, 2025, https://professionsfinancieres.com/sites/professionsfinancieres.com/files/32_MNA_From%20movie%20to%20event%20theatre%20%E2%80%93%20Assessing%20the%20value%20of%20a%20cinema%20ticket.pdf

Normal Goods & Luxury Goods | INOMICS, accessed November 7, 2025, https://inomics.com/terms/normal-goods-luxury-goods-1531734

Cost of Living in Columbia MO - Apartments.com, accessed November 7, 2025, https://www.apartments.com/cost-of-living/columbia-mo/

Cost of Living in Madison WI - Apartments.com, accessed November 7, 2025, https://www.apartments.com/cost-of-living/madison-wi/

Cost of Living in San Francisco CA - Apartments.com, accessed November 7, 2025, https://www.apartments.com/cost-of-living/san-francisco-ca/

Used Cars, Trucks and SUVs for Sale in Columbia, MO - Joe Machens Ford, accessed November 7, 2025, https://www.machensford.com/used-inventory/index.htm

Shop Used Cars Priced Below $20K for Sale Madison, Wisconsin - Wilde East Towne Honda, accessed November 7, 2025, https://www.wildeeasttownehonda.com/used-inventory/vehicles-under-20000-madison-wi.htm

Used cars in Madison, WI for sale - CarMax, accessed November 7, 2025, https://www.carmax.com/cars?location=madison+wi

Used Cars for Sale in San Francisco, CA | Edmunds, accessed November 7, 2025, https://www.edmunds.com/used-cars-san-francisco-ca/

Car Market Analysis Report July 2024 - California Dealer Academy, accessed November 7, 2025, https://www.californiadealeracademy.com/learn/?p=car-market-analysis-report-july-2024-240715

This Is the Average Price of a Used Car in Each State - iSeeCars.com, accessed November 7, 2025, https://www.iseecars.com/used-car-prices-by-state-study

Average Rent in Columbia, MO - RentCafe, accessed November 7, 2025, https://www.rentcafe.com/average-rent-market-trends/us/mo/columbia/

Average Rent in Columbia, MO - Latest Rent Prices by Neighborhood - Apartments.com, accessed November 7, 2025, https://www.apartments.com/rent-market-trends/columbia-mo/
Rental Market Trends & Average Rent in Madison, WI, accessed November 7, 2025, https://www.rent.com/wisconsin/madison-apartments/rent-trends

Average Rent in Madison, WI: 2025 Rent Prices by Neighborhood - RentCafe, accessed November 7, 2025, https://www.rentcafe.com/average-rent-market-trends/us/wi/madison/

Average Rent in San Francisco, CA and Rent Price Trends - Zumper, accessed November 7, 2025, https://www.zumper.com/rent-research/san-francisco-ca

Average Rent in San Francisco, CA: 2025 Rent Prices by Neighborhood - RentCafe, accessed November 7, 2025, https://www.rentcafe.com/average-rent-market-trends/us/ca/san-francisco/

How Much Does a Movie Ticket Cost in 2025? State-by-State Prices and Date Night Totals, accessed November 7, 2025, https://www.cabletv.com/entertainment/cost-of-a-movie-ticket

Regal cinema ticket prices : r/boone - Reddit, accessed November 7, 2025, https://www.reddit.com/r/boone/comments/1d111r0/regal_cinema_ticket_prices/

What Is the ​Cost of Living in Madison WI? A Dive Into the Average Cost of Living in Madison WI - Straightline Moving, accessed November 7, 2025, https://straightlinemovingcompany.com/blog/cost_of_living_in_madison_wi/

The Cheapest & Best Movie Theaters in SF, accessed November 7, 2025, https://brokeassstuart.com/p/the-cheapest-best-movie-theaters-in-sf

Guide for Luxury Bag Brands Price Increases in 2024 - Collector's Cage, accessed November 7, 2025, https://collectorscage.com/blogs/guides/guide-for-luxury-bag-brands-price-increases-in-2024
