# API

This folder governs the frontend's interaction with the backend through its APIs.

## Structure

- [httpCodes](./httpCodes.js): A handy dictionary on HTTP codes.
- [payloadBuilder](./payloadBuilder.js): Transformation functions from frontend -> backend.
- [payloadReceiver](./payloadReceiver.js): Transformation functions from backend -> frontend.
- [SimulationAPI](./SimulationAPI.js): the class that handles the REST API and holds the WebSocket connection for sending actions.
