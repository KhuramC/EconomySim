# Build Frontend (Vite/NPM) ---
FROM node:18 AS build-step

WORKDIR /app/frontend

COPY ./frontend/package*.json ./
RUN npm install

COPY ./frontend ./
RUN npm run build

# Setup Backend (Python/FastAPI) ---
FROM python:3.11

WORKDIR /app

RUN apt-get update && apt-get install -y gcc

COPY ./backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY ./backend ./backend

# Connect Frontend to Backend
# Note: Vite usually builds to 'dist'.
COPY --from=build-step /app/frontend/dist ./frontend/dist

ENV PYTHONPATH=/app/backend

# Run the server
CMD uvicorn api.main:app --host 0.0.0.0 --port $PORT