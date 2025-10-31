# Core

This directory contains:

- the model object with the simulation loop/step logic with parameters.
- the calculation of economic indicators.

## Indicators

### Lorenz Curve

This tracks wealth inequality as a curve in the simulation. It is currently implemented as described in https://www.datacamp.com/tutorial/lorenz-curve.

It should be noted that we have altered it to track wealth distribution (current balance of personAgents), and not income distribution. 

### Gini Coefficient

This tracks wealth inequality as a float value in the simulation. It is currently implemented as described in https://www.datacamp.com/blog/gini-coefficient.

It should be noted that we have altered it to track wealth distribution (current balance of personAgents), and not income distribution. 