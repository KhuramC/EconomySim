#!/bin/bash

set -e 
pip install poetry==2.1.4
poetry config virtualenvs.create True
poetry config virtualenvs.in-project True
