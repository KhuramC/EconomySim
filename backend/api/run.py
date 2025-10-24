import uvicorn

def start():
    """A function that Poetry can call to run the server."""
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    start()