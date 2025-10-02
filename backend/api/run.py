import uvicorn

def start():
    """A function that Poetry can call to run the server."""
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)

# This part allows you to still run "python run.py" directly
if __name__ == "__main__":
    start()