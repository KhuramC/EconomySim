# Backend

## Testing

Because the backend is in Python, pytest will be used for testing anything in the backend.
[httpx](https://fastapi.tiangolo.com/tutorial/testing/) has good integration with pytest, so that
can be used for specifically testing the FastAPI part.

## Steps to Start Developing

The backend, being Python based, will use [poetry](https://python-poetry.org/) to help
manage dependencies. Poetry creates a virtual environment for the package being developed and
ensures that all the python dependencies have been installed.

1. Make sure one has poetry installed(it already is in the devcontainer).
1. Cd into the backend directory.
1. Run `poetry install` to install dependencies
1. Use jupyter notebooks to do easy dev testing (for more info see [run_sim.ipynb](./run_sim.ipynb))
1. Use pytest for structured unit/integration tests

### Important Poetry Commands

- `poetry install` (in directory with [pyproject.toml](./pyproject.toml)) - installs dependencies
- `poetry run pytest` - runs tests in venv
- `poetry env activate` - shows command to activate venv
- `eval $(poetry env activate)` - activates venv
