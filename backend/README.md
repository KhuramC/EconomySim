# Backend

## Structure

There are three main subdirectories:
- [api](./api/): where the FastAPI server runs. 
- [engine](./engine/): where the logic of the simulation engine using Mesa is.
- [tests](./tests/): where tests for the other two directories live.  

## Testing

Because the backend is in Python, `pytest` will be used for testing anything in the backend.
[httpx](https://fastapi.tiangolo.com/tutorial/testing/) has good integration with `pytest`, so that
can be used for specifically testing the FastAPI part.

## Steps to Start Developing

The backend, being Python based, will use [poetry](https://python-poetry.org/) to help
manage dependencies. Poetry creates a virtual environment for the package being developed and
ensures that all the python dependencies have been installed.

1. Make sure one has poetry installed(it already is in the dev container).
1. Cd into the backend directory.
1. Run `poetry install` to install dependencies
1. Run `poetry run dev` to start the FastAPI server
1. Use jupyter notebooks to do easy dev testing (for more info see [run_sim.ipynb](./run_sim.ipynb))
1. Use `pytest` for structured unit/integration tests

### Important Poetry Commands

- `poetry install` (in directory with [pyproject.toml](./pyproject.toml)) - installs dependencies
- `poetry run pytest` - runs tests in virtual environment
- `poetry run dev` starts the FastAPI server in virtual environment
- `poetry env activate` - shows command to activate virtual environment
- `eval $(poetry env activate)` - activates virtual environment

