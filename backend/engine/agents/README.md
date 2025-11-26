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

where $B$ is the total budget, and $\sigma = 1/(1-z)$ is the elasticity of substitution provided that the purchases do not exceed the budget (equivalently such that $\sum_{i=1}^n p_ix_i \le B$).

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

The agent allocates their weekly income minus their `savings_rate` to their spending budget.

TODO: update with how savings rate gets updated.

#### Determining Purchase Quantity

Traditionally, a `PersonAgent` is unable to buy any additional goods that cause them to go over budget. However, in cases where the agent can afford 95% of the additional unit, they are allowed to go exceed their budget slightly. This was done to compensate for floating point errors that can occur, causing what should be a whole number quantity be just slightly below, leading it to be rounded down unnecessarily.

#### Shortage Handling

**How do we determine what happens if they want more than is available to buy?**

Currently, if a good is unavailable, the agent simply doesn't spend that portion of their budget. This unspent money is effectively saved for the next cycle.

TODO: update with how shortage handling is dealt with.

## IndustryAgent

### Price Determination

#### Profit Maximization

#### Average Cost Pricing

### Goods Production

### Employment
