# Agents

There are two main agents:

1. Agents representing individual people([person.py](./person.py))
   - People's demand for goods([demand.py](./demand.py))
1. Agents representing industry types([industry.py](./industry.py))
   - Industry's pricing strategies of goods([pricing.py](./pricing.py))

These files govern the different actions that the agents can take
during timesteps in the simulation.

## PersonAgent

### Demand

A `PersonAgent`s demand for goods is modeled through the CES utility function and Marshallian demand equations. The CES utility function is defined as

$$
u(x) = (\sum_{i=1}^{n} a_{i} x_{i}^{z})^{1/z}
$$

where $a_i$ is the preference for good $i$ as a decimal, $x_i$ is the number of good $i$, and $z$ is the degree of substitutability.

The idea is that `PersonAgent`s would like to maximize their utility whenever purchasing goods. The Marshallian demand equations maximize utility by solving for all quantities($x_i$) of each good. The demand equations are defined as

$$
\hat{x_i} = \frac{a_i^{\sigma}p_i^{-\sigma}B}{\sum_{j=1}^n a_j^{\sigma}p_j^{1-\sigma}}
$$

where $B$ is the total budget, and $\sigma = 1/(1-z)$ is the elasticity of substitution provided that the purchases do not exceed the budget (equivalently such that $\sum_{i=1}^n p_i\hat{x_i} \le B$).

If $\sigma = 1$ (equivalently $z=0$), the equation simplifies to the Cobb-Douglas demand function, which is defined as

$$
\hat{x_i} = \frac{a_i}{p_i}B
$$

### Seeking Employment

TODO: add stuff about employment logic.

### Developer Decisions

#### Sigma ($\sigma$)

**What is the constant of elasticity for each `PersonAgent`?**

A single constant $\sigma$ for all `PersonAgent`s is used. It's less realistic and assumes that all individuals, regardless of their economic class, have the same willingness to substitute goods.

TODO: Implement a demographic-specific value. This adds a layer of realism for example, lower-income households might have a higher $\sigma$, indicating a greater willingness to substitute for cheaper alternatives.

#### Budget

**How much of weekly income/total balance to spend?**

The agent allocates their weekly income to their spending budget.

Spending budget is then broken down into `industry_savings`, which represents income designated for spending in each industry.

`industry_savings` carries over funds between cycles.

#### Determining Purchase Quantity

A `PersonAgent` is unable to buy any additional goods that cause them to go over their industry-specific budget.

If the current amount in `industry_savings` doesn't allow for the purchase of a single good, the funds will carry over to the next cycles until a purchase can be made.

A `custom_round` function is used to account for floating point errors.  If the next purchasable unit is within 1e-9 (one billionth of the cost), the additional 
purchase will be made.


#### Shortage Handling

**How do we determine what happens if they want more than is available to buy?**

When `IndustryAgent` doesn't produce enough goods to meet the market demand, a `PersonAgent` will save the money they would have spent on that industry.

The additional funds are saved in the `industry_savings` dict, which is keyed by IndustryType.

On the next cycle, the saved up funds will be put towards purchasing additional quantities.

## IndustryAgent

### Price Determination

Different industries have different priorities. A lot of industries seek to maximize profit, while some just provide a service (like utilities companies). There are two main strategies employed: profit maximization and average cost pricing. Both strategies employ finding the quantity($Q$) and then calculating the price($P$) based on the demand curve.

#### Assumptions

We assume that the demand curve is linear due to its ease of approximation:

$$
P = A - BQ
$$

where $A$ and $B$ are [estimated](#approximating-the-demand-curve). Conceptually, $A$ is intercept, or the price whenever $q=0$, and $B$ is the slope.

TODO: This estimation does not occur currently.

We also assume that the total cost is a function of fixed costs($F$) and variable costs($V$).

$$
TC = F + VQ
$$

Both strategies require that these be defined as a function of $Q$ to function, but that is all.

#### Profit Maximization

Profit maximization tries to find the quantity/price of goods such that marginal revenue is equal to marginal cost. Marginal revenue can be estimated from the demand.
where $P$ is the price, $Q$ is the quantity, and $A,B$ are the intercept and slope respectively.

Total revenue is quantity sold multiplied by the price it is sold at. It can be expressed a function of quantity:

$$
TR = QP = Q(A-BQ) = AQ - BQ^2
$$

Marginal revenue is the rate of change of total revenue, which is the derivative(with respect to $Q$):

$$
MR = A - 2BQ
$$

Marginal cost is the change in total cost from producing one more good:

$$
MC = \frac{\Delta TC}{\Delta Q}
$$

which is simply the derivative of $TC$ with respect to $Q$:

$$
MC = V
$$

We can set these equal to each other and solve for $Q$:

$$
\begin{align}
A - 2BQ &= V\\
A - V &= Q(2B)\\
\frac{A-V}{2B} &= Q
\end{align}
$$

$A,B$ need to be estimated, but $V$ should already be known.

#### Average Cost Pricing

Average cost pricing tries to set the price to the average cost:

$$
P = AC = \frac{TC}{Q} = \frac{F+VQ}{Q}
$$

However, as noted earlier, the price is approximated as a function of $Q$ as well. We can set these equations equal to each other and solve for $Q$:

$$
\begin{align}
A - BQ &= P =\frac{F + VQ}{Q}\\
AQ - BQ^2 &= F + VQ\\
0 &= BQ^2 + (V-A)Q + F
\end{align}
$$

This is a standard quadratic equation that can be solved with the quadratic formula:

$$
Q = \frac{(A-V) \pm \sqrt{(V-A)^2 - 4BF}}{2B}
$$

Quadratic equations can have 0, 1, or 2 real solutions. If 2 solutions are found, the higher quantity will be chosen to incentivize more sales. If 1 solution is found, that quantity will be used. If no solution is found, profit maximization will be used instead to minimize losses.

#### Approximating the Demand Curve

Both solutions above for determining the price are dependent on the slope and intercept being approximated each tick.

TODO: put in approximation logic

### Production of Goods

TODO: put good production logic

### Employment

TODO: put employment logic
