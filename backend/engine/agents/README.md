# Agents

There are two main agents:

1. [Agents representing industry types](./industry.py)
1. [Agents representing individual people](./person.py)

These files govern the different actions that the agents can take
during timesteps in the simulation.
There are other files governing different economic logic taken by the agents.


## Developer Decisions

### Sigma ($\sigma$)

**What is the constant of elasticity for each person agent?**

Using a single, constant $\sigma$ for all PersonAgents. It's less realistic and assumes that all individuals, regardless of their economic class, have the same willingness to substitute goods.

TODO: Implement a demographic-specific value. This adds a layer of realism for example, lower-income households might have a higher $\sigma$, indicating a greater willingness to substitute for cheaper alternatives.


### Budget

**How much of weekly income/total balance to spend?**

Currently, the agent allocates all of their weekly income to purchasing goods (wow! look at that participation in the economy!).


### Shortage Handling

**How do we determine what happens if they want more than is available to buy?** 

Currently, if a good is unavailable, the agent simply doesn't spend that portion of their budget. This unspent money is effectively saved for the next cycle.