#!/bin/bash

set -e 
pip install poetry==2.1.4
poetry config virtualenvs.create true
poetry config virtualenvs.in-project true
