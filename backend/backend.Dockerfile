FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml gunicorn_config.py ./

RUN pip install .

# Installs stockfish
RUN apt-get update && apt-get install -y stockfish

# Define environment variable
ENV FLASK_APP=run.py
