from fastapi import FastAPI, APIRouter
from engine.interface.controller import ModelController

# These are the singleton instances that will be shared across the application.
_app = FastAPI()
_controller = ModelController()
_router = APIRouter()


def get_controller() -> ModelController:
    """Function to get the shared ModelController instance."""
    return _controller


def get_app() -> FastAPI:
    """Function to get the shared FastAPI instance."""
    return _app


def get_router() -> APIRouter:
    """Function to get the shared APIRouter instance."""
    return _router
