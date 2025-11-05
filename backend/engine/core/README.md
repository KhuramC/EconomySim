# Core

This directory contains:

- the model object with the simulation loop/step logic with parameters.
- the calculation of economic indicators.

## Model

### Inflation

The way we approach inflation in our simulation is by implementing **cost-push inflation**. This method directly uses our simulation's existing agent-based logic to have the effects of inflation (rising prices) emerge naturally, which then causes a decrease in buying power. 

Currently, `IndustryAgent`s are representative agents (monopolies) that use profit-maximization to set prices for their goods. This logic is based on their perceived demand curve and their marginal cost. Marginal cost is calculated as `MC = F + VQ` where `F` is fixed costs and `V` is variable cost.

By increasing these costs (`F` and `V`) by the model's `inflation_rate` each week, we are simulating the rising costs of raw materials, energy, and property. When the `IndustryAgent`s run their `determine_price` step, their profit-maximization formula will *naturally* lead them to raise their prices to protect their margins. When the `PersonAgent`s then try to purchase goods, their (unchanged) nominal `current_money` will buy fewer goods at these new, higher prices. This is the decrease in buying power.

**Other Considerations**

* Decreasing every `PersonAgent`'s `current_money` is less ideal because it acts less of an inflation model and more of a wealth tax. It doesn't simulate rising prices of goods, and it punishes saving money.

* Decreasing money and increasing costs would be double-dipping. The `PersonAgent`s would have their buying power reduced twice—once when you manually decrease their money, and a second time when they face the higher prices set by industries.


## Indicators

### Lorenz Curve

This tracks wealth inequality as a curve in the simulation. It is currently implemented as described in https://www.datacamp.com/tutorial/lorenz-curve.

It should be noted that we have altered it to track wealth distribution (current balance of personAgents), and not income distribution. 

### Gini Coefficient

This tracks wealth inequality as a float value in the simulation. It is currently implemented as described in https://www.datacamp.com/blog/gini-coefficient.

It should be noted that we have altered it to track wealth distribution (current balance of personAgents), and not income distribution. 