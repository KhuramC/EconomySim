# Agents

There are two main agents:

1. [Agents representing industry types](./industry.py)
1. [Agents representing individual people](./person.py)

These files govern the different actions that the agents can take
during timesteps in the simulation.
There are other files governing different economic logic taken by the agents.

## Demand

Demand is modeled through the CES utility function and Marshallian demand equations. The CES utility function is defined as

$$
u(x) = (\sum_{i=1}^{n} a_{i} x_{i}^{z})^{1/z}
$$

where $a_i$ is the preference for good $i$ as a decimal, $x_i$ is the number of good $i$, and $z$ is the degree of substitutability.

The idea is that `PersonAgent`s would like to maximize their utility whenever purchasing goods. The Marshallian demand equations maximize utility by solving for all quantities($x_i$) of each good. The demand equations are defined as

$$
\hat{x_i} = \frac{a_i^{\sigma}p_i^{-\sigma}B}{\sum_{j=1}^n a_j^{\sigma}p_j^{1-\sigma}}
$$

where $B$ is the total budget, and $\sigma = 1/(1-z)$ is the elasticity of substitution.

If $\sigma = 1$ (equivalently $z=0$), the equation simplifies to the Cobb-Douglas demand function, which is defined as

$$
\hat{x_i} = \frac{a_i}{p_i}B
$$

## Developer Decisions

### Sigma ($\sigma$)

**What is the constant of elasticity for each person agent?**

Using a single, constant $\sigma$ for all `PersonAgent`s. It's less realistic and assumes that all individuals, regardless of their economic class, have the same willingness to substitute goods.

TODO: Implement a demographic-specific value. This adds a layer of realism for example, lower-income households might have a higher $\sigma$, indicating a greater willingness to substitute for cheaper alternatives.

### Budget

**How much of weekly income/total balance to spend?**

The agent allocates their weekly income minus their `savings_rate` to their spending budget.

### Determining Purchase Quantity

In cases where the person agent can not afford an additional unit without going over budget, the agent will typically not purchase the additional unit
However, in cases where the agent can afford 95% of the additional unit, they are allowed to go exceed their budget slightly.  
This implementation is largely a way to compensate for floating point errors resulting from long decimal numbers

### Shortage Handling

**How do we determine what happens if they want more than is available to buy?**

Currently, if a good is unavailable, the agent simply doesn't spend that portion of their budget. This unspent money is effectively saved for the next cycle.
