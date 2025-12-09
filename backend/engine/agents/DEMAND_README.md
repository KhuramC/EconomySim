
# Gathering Demand Parameters
Industries require an estimation of the demand for a good in order to calculate the new price.
One way of accomplishing this is to use the CES demand formula to find the quantity demanded at the 
current price, then finding the tangent line approximation at that point.
From there, the slope and price when quantity demanded is zero can be approximated.
Finally, the slope and q0 values can be aggregated among all person agents to find the demand for the entire model

Refer to this explanation for how the tangent line is approximated:
https://chatgpt.com/s/t_691a60411ba08191b69e7978ca167fb4

When sigma is set to 1, the CES utility function is simplified to the Cobb-Douglass Function.
What this looks like in effect is this:

`y = [Budget for Industry]/x`

where `y` is the quantity demanded, and `x` is the price

This produces a curve with limits on the x axis and the y axis, as shown below.  Our function will take the CES utility function,
take the derivative, and derive the tangent line at the current point in order to estimate demand.  See the graph below:

![image](/workspaces/EconomySim/pictures/TangentLineApproximation.png)