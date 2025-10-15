# Engine

The engine exists on its own, providing an interface with a controller that the rest of the backend can use.

## Structure

- [agents](./agents/): the agents of the simulation and their associated logic.
- [core](./core/): the logic for the simulation loop of the model as a whole, including economic indicators.
- [interface](./interface/): the way that outside services communicate with the backend to create and step through models.
- [types](./types/): various types that are necessary.

**Note**: Anything outside this directory(such as the FastAPI server) should never directly use anything within the agents or core directory. They should only use the interfaces and the types in that directory.
