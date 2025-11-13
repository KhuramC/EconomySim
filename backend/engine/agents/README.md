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

The agent allocates their weekly income minus their `savings_rate` to their spending budget.


### Shortage Handling

**How do we determine what happens if they want more than is available to buy?** 

Currently, if a good is unavailable, the agent simply doesn't spend that portion of their budget. This unspent money is effectively saved for the next cycle.

## Employment System

The simulation's job market operates on a two-part system: Industries decide how many workers they need and set wages, and unemployed Persons actively seek the best-paying jobs they can find.

### `IndustryAgent.change_employment(self)`

This is the industry's "manager" step. Once per cycle, the industry looks at its sales from the previous week and decides the perfect number of employees it needs to meet that same level of demand in a 40-hour work week. If it has too many employees, it fires the extra ones. It also updates the wage it will offer for any new, open positions.

### `IndustryAgent.determine_wages(self)`

The industry checks the "going rate" for workers in the whole economy (model.market_wage) and decides to offer that. It will always offer at least the simulation's minimum wage.

### `IndustryAgent.fire_employees(self, count: int)`

When an industry needs to lay off a certain number of workers it shuffles its entire list of employees randomly and fires the required number from the top of the shuffled list.

### `IndustryAgent.hire_employee(self, person: "PersonAgent")`

This is the industry's side of the job interview. When a person applies, the industry checks if it has an open spot (i.e., if its current number of employees is less than its desired number). If so, it hires the person and returns True. Otherwise, returns False.

### `PersonAgent.change_employment(self)`

This is the unemployed person's "job hunt" step. If the person is unemployed, they get a list of all industries in the economy that have open positions. They sort this list from the highest-paying job to the lowest. They then apply to the best-paying job first. If they get it, they stop. If not (because someone else got it first), they apply to the next-best-paying job, and so on, until they are hired.
