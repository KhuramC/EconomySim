# Simulation Setup Components

The components here are for setting up the simulation.

There are two main types of components, Accordions and helpers. Helper components are used within the accordions.

Here is a brief description of the available components:

- [`PersonalIncomeTaxBracket`](./PersonalIncomeTaxBracket.jsx): A progressive tax bracket.
- [`SpendingBehavior`](./SpendingBehavior.jsx): A set of proportions that must sum to 1.
- [`TemplateChooser`](./TemplateChooser.jsx): A template selector for simulation parameters.
- [`EnvironmentalAccordion`](./EnvironmentalAccordion.jsx): An accordion with environmental parameters.
- [`DemographicAccordion`](./DemographicAccordion.jsx): An accordion with demographic parameters.
- [`IndustryAccordion`](./IndustryAccordion.jsx): An accordion with industry parameters.
- [`PolicyAccordion`](./PolicyAccordion.jsx): An accordion with policy parameters.

There is also [`ParameterAccordion`](./ParameterAccordion.jsx), but this is a base component for the various accordion components and should not be used directly.
