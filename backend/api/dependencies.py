from engine.interface.controller import ModelController

# This is the singleton instance that will be shared across the application.
_controller_instance = ModelController()


def get_controller() -> ModelController:
    """Function to get the shared ModelController instance."""
    return _controller_instance
