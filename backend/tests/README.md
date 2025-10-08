# Testing Using Pytest

Pytest is the framework being used for testing the backend. Almost all functions should be unit tested, and should follow the same structure of the regular file. So for a file in `/engine/core/filename.py`, the test file should be in `/tests/engine/core/test_filename.py`, with the test functions in there following the same format. If you do not have `test_` in the name of the test functions, pytest will not know that they are meant to be tests.

## Important Commands / Flags

- `poetry run pytest`: Runs the unit tests.
- `-vvv`: Makes test output more verbose.
- `--cov=$dir$`: Gets code coverage of that directory. It is within the context of being in the backend directory, so `--cov=api` works
- `--cov-report=html`: Gives the code coverage report as a set of html files in the `htmlcov` directory.
- `--cov-report=term-missing`: Gives the code coverage report in the terminal along with the tests output.
- `--cov-branch`: Gives the code coverage for branches within if/else statements

There are other flags, but these are all that should be necessary.
