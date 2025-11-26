# Input Components

The components here are for providing inputs to the user in an easy and consistent manner. All inputs are wrapped in a Material UI `Grid` for easy composition within higher level components and contain a help icon if text is passed in.

Here is a brief description of the available components:

- [`ParameterMenuInput`](./ParameterMenuInput.jsx): A dropdown for selecting amongst discrete options.
- [`ParameterToggleInput`](./ParameterToggleInput.jsx): A toggle for a Boolean value.
- [`ParameterNumInput`](./ParameterNumInput.jsx): A field to input numbers.
- [`ParameterSliderInput`](./ParameterSliderInput.jsx): A slider for inputting numbers.
- [`ToggleableSliderInput`](./ToggleableSliderInput.jsx): A `ParameterSliderInput` that can toggled on and off.

There is also [`ParameterInput`](./ParameterInput.jsx), but this is a base class for components that use text fields and is not meant to be used directly.
