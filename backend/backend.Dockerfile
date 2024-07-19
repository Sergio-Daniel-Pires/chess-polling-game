FROM python:3.12-slim

WORKDIR /backend

COPY backend/pyproject.toml ./

RUN pip install .

# Installs stockfish
RUN apt-get update && apt-get install -y stockfish

# Define environment variable
ENV FLASK_APP=run.py
ENV FLASK_ENV=development
