from fastapi import FastAPI
import uvicorn

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/test")
async def test():
    return {"message": "Test endpoint"}

def start():
    print("Hello World")
    uvicorn.run("backend.api.main:app", host="0.0.0.0", port=8000, reload=True, workers=2)

if __name__ == "__main__":
    start()