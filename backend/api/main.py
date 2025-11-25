from fastapi.middleware.cors import CORSMiddleware

from .dependencies import get_app, get_router

# Import the route modules to ensure their routes are registered with the router
from . import rest
from . import websocket

app = get_app()
router = get_router()


# Define allowed origins for both HTTP and WebSocket
origins = [
    "http://localhost:5173",  # React dev server
    "http://127.0.0.1:5173",  # React dev server pt.2
]

# Middleware for standard HTTP requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers (like Content-Type)
)

# Add the router with all the registered routes to the main app
app.include_router(router)