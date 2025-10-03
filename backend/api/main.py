from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from engine.interface.controller import ModelController
from engine.types.industry_type import IndustryType
from .city_template import CityTemplate

controller = ModelController()
app = FastAPI()


# --- 2. Define Request Body Models using Pydantic ---
# This ensures data sent to your API is valid
class ModelCreateRequest(BaseModel):
    num_people: int = Field(..., gt=0, description="Number of person agents to create.")
    policies: dict[str, float | dict[IndustryType, float]] = Field(
        ..., description="Tax rates for the simulation."
    )


# --- 3. Create API Endpoints for the Controller ---


@app.get("/")
async def root():
    return {"message": "EconomySim API is running."}


@app.get("/templates/{template_name}")
async def get_city_template_config(template_name: CityTemplate):
    """
    Retrieves the predefined settings for a given city template.
    """
    if template_name is not None:
        config = template_name.config
        return config
    else:
        raise HTTPException(
            status_code=404, detail=f"City Template '{template_name}' not found."
        )


@app.post("/models", status_code=201)
async def create_model(request: ModelCreateRequest):
    """
    Creates a new simulation model.
    """
    try:
        model_id = controller.create_model(
            num_people=request.num_people, starting_policies=request.policies
        )
        return {"message": "Model created successfully", "model_id": model_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/models/{model_id}")
async def get_model_indicators(model_id: int):
    """
    Retrieves the latest collected data for a specific model.
    """
    try:
        data = controller.get_indicators(model_id)
        return data
    except KeyError:
        raise HTTPException(
            status_code=404, detail=f"Model with id {model_id} not found."
        )


@app.post("/models/{model_id}/step")
async def step_model(model_id: int):
    """
    Advances the simulation model by one step.
    """
    try:
        controller.step_model(model_id)
        return {"message": f"Model {model_id} advanced to the next step."}
    except KeyError:
        raise HTTPException(
            status_code=404, detail=f"Model with id {model_id} not found."
        )


@app.websocket("/ws/models/{model_id}/step")
async def websocket_step_model(websocket, model_id: int):
    """
    Advances the simulation model by one step via WebSocket.
    """
    await websocket.accept()
    try:
        while True:
            await websocket.receive_text()  # Wait for a message from the client
            try:
                controller.step_model(model_id)
                data = controller.get_indicators(model_id)
                await websocket.send_json(data)  # Send updated data back to the client
            except ValueError:
                await websocket.send_json(
                    {"error": f"Model with id {model_id} not found."}
                )
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()
        print(f"WebSocket connection closed.")


@app.delete("/models/{model_id}")
async def delete_model(model_id: int):
    """
    Deletes a simulation model.
    """
    try:
        controller.delete_model(model_id)
        return {"message": f"Model {model_id} deleted."}
    except ValueError:
        raise HTTPException(
            status_code=404, detail=f"Model with id {model_id} not found."
        )
