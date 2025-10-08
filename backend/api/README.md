# Backend Server

This directory will contain the logic for the FastAPI server and API endpoints.

## Structure

- [city_template](./city_template.py): the templates for a simulation.
- [main.py](./main.py): the API endpoints for the frontend to connect to.
- [run.py](./run.py): what actually runs the FastAPI server.

## Important Commands

Within the backend directory, assuming everything is up to date, one can run
`poetry run dev` to start the FastAPI server. FastAPI has an easy way to test the server by going to `docs` like this: [http://localhost:8000/docs](http://localhost:8000/docs) once it is running.
