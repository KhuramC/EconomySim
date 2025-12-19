# Core

This directory contains:

- the model object with the simulation loop/step logic with parameters.
- the calculation of economic indicators.

## Model

### Initializing `PersonAgent`s

The simulation uses **heterogeneous agent creation** to model a diverse and realistic population. Instead of creating identical "representative agents" for each demographic, the model generates `n` unique `PersonAgent`s, each with their own specific income, starting money, and spending preferences. This micro-simulation approach allows for more realistic and emergent economic behavior, as individuals *within* the same demographic will react differently to economic changes (like price increases).

**Lognormal Distribution**

When `setup_person_agents` is called, it first calculates the exact integer number of agents for each demographic using the `num_prop` helper function, which correctly allocates `total_people` across the given proportions without rounding errors. It then generates unique `income` and `current_money` values for each new agent by sampling from a **lognormal distribution** using `generate_lognormal`. This distribution is used because income and wealth are known to be log-normally distributed in the real world (i.e., they have a long tail and cannot be negative), which is more accurate than a standard bell curve.

**Dirichlet Distribution**

The most important step is generating unique spending preferences. This is achieved by sampling from a **Dirichlet distribution** (`np.random.dirichlet`). The `spending_behavior` dictionary for a given demographic (e.g., `{"GROCERIES": 0.5, "LUXURY": 0.1, ...}`) is used as the `alpha` vector (the mean) for the distribution. The Dirichlet function returns `n` unique preference vectors, and each vector's components naturally sum to 1.0, making it statistically perfect for modeling spending percentages.

**The Concentration Parameter**

The variance of these preferences is controlled by the `preference_concentration` parameter. This value scales the `alpha` vector before it's passed to the Dirichlet function.

* A **high concentration** (e.g., 100) will produce agents with preferences *very close* to their demographic's average (low variance).

* A **low concentration** (e.g., 5) will produce agents with *wildly different* preferences from each other (high variance).

This provides a crucial knob for tuning the simulation's "randomness" while ensuring the agents, on average, match their demographic's profile.

**Other Considerations**

* **Using Identical Agents**: The main alternative was to assign every agent the exact same `spending_behavior` as their demographic. This was rejected because it leads to unrealistic, synchronized behavior. If all agents have identical preferences, they will all react to price changes in the exact same way, which does not reflect a real economy.

* **Random Normalization**: Simply generating random numbers for each preference and normalizing them (dividing by the sum) was also rejected. That approach provides no control over the *mean* preference. The Dirichlet distribution is the statistically correct method for sampling random vectors that are centered around a known mean (`alpha`) and sum to 1.


### Inflation

The way we approach inflation in our simulation is by implementing **cost-push inflation**. This method directly uses our simulation's existing agent-based logic to have the effects of inflation (rising prices) emerge naturally, which then causes a decrease in buying power. 

Currently, `IndustryAgent`s are representative agents (monopolies) that use profit-maximization to set prices for their goods. This logic is based on their perceived demand curve and their marginal cost. Marginal cost is calculated as `MC = F + VQ` where `F` is fixed costs and `V` is variable cost.

By increasing these costs (`F` and `V`) by the model's `inflation_rate` each week, we are simulating the rising costs of raw materials, energy, and property. When the `IndustryAgent`s run their `determine_price` step, their profit-maximization formula will *naturally* lead them to raise their prices to protect their margins. When the `PersonAgent`s then try to purchase goods, their (unchanged) nominal `current_money` will buy fewer goods at these new, higher prices. This is the decrease in buying power.

**Compounding Percentage**

Since the inflation rate is applied weekly but it is received from the user as an annualized percentage, a conversion must be done. If you compounded a `weekly_rate` set at `annual_rate / 52` it would be wrong and overshoot the `annual_rate`.

$$
(1 + r_{weekly})^{52} = (1+ r_{annual})
$$

We can solve for $r_{weekly}$ to get the correct compounding weekly percentage.

**Other Considerations**

* Decreasing every `PersonAgent`'s `current_money` is less ideal because it acts less of an inflation model and more of a wealth tax. It doesn't simulate rising prices of goods, and it punishes saving money.

* Decreasing money and increasing costs would be double-dipping. The `PersonAgent`s would have their buying power reduced twice—once when you manually decrease their money, and a second time when they face the higher prices set by industries.


## Indicators

### Hoover Index

This tracks income inequality as a number in the simulation. It is related to the Lorenz Curve in that it represents the maximum vertical distance from the curve to the theoretical straight line of perfect income equality. It indicates the proportion of income that needs to be transferred from the top of the bottom of the distribution to reach that perfect equality. A value of 0 implies nothing needs to be transferred; a value of 1 implies everything needs to be transferred. There are many slight variations, but the implementation being used is most similar to the `R` [function](https://search.r-project.org/CRAN/refmans/EconGeo/html/hoover_index.html), where one sums up the absolute value of all income shares subtracted by the population share:

$$
H = \frac{1}{2} \sum_{i=1}^{N} |\frac{y_i}{y_{total}} - \frac{1}{N}|
$$

Where $y_i$ is the income of agent $i$, $y_{total}$ is the total income, and $N$ is the total number of agents.

### Lorenz Curve

This tracks wealth inequality as a curve in the simulation. It is currently implemented as described in https://www.datacamp.com/tutorial/lorenz-curve.

It should be noted that we have altered it to track wealth distribution (current balance of personAgents), and not income distribution. 

### Gini Coefficient

This tracks wealth inequality as a float value in the simulation. It is currently implemented as described in https://www.datacamp.com/blog/gini-coefficient.

It should be noted that we have altered it to track wealth distribution (current balance of personAgents), and not income distribution. 

### GDP

GDP will be tracked by summing the market value of all final goods and services produced, or more accurately, the value added at each stage of production. In other words, it is a simple sum of what was created that week.

$$\text{GDP} = \sum (\text{Value of Produced Goods by Industry})$$

**Another approach: (Expenditure Approach)**

This method is based on the idea that the value of all goods and services produced in an economy can be calculated by summing up what is spent on them. It is represented by the formula:

$$\text{GDP} = \text{C} + \text{I} + \text{G} + (\text{X} - \text{M})$$

C (consumption): Total spending by households on final goods and services.

I (investment): Spending by businesses on capital goods, inventory, and residential construction.

G (government spending): Spending by the government on final goods and services (e.g., infrastructure, defense).

(X - M) (Net Exports): Total exports minus total imports.

The Bureau of Economic Analysis (BEA) is the U.S. government division responsible for analyzing and reporting GDP data. It uses this as standard method. The reason we went with the production is approach is because this approach is more computationally feasible since the model is designed around discrete IndustryAgents (representative monopolies) who track their own production and prices, making this easy to aggregate.
