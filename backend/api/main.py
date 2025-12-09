import os

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

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
    # May want to add Heroku URL here later
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

# Serve React Frontend
current_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dist = os.path.join(current_dir, "../../frontend/dist") 

if os.path.isdir(frontend_dist): # Doesn't exist locally, but exists in Docker
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    # Serve Index HTML on root "/"
    @app.get("/")
    async def serve_root():
        return FileResponse(os.path.join(frontend_dist, "index.html"))
    
    # Catch-all route
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        if full_path.startswith("api"):
            return {"error": "API route not found", "status_code": 404}
        return FileResponse(os.path.join(frontend_dist, "index.html"))
    
else:
    print(f"WARNING: React build not found at {frontend_dist}. Frontend will not be served.")