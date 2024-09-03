import os

REDIS_CONN = os.environ.get("REDIS_CONN", "127.0.0.1")
REDIS_PASSWORD = os.environ.get("REDIS_PASSWORD", "")
MONGO_CONN = os.environ.get("MONGO_CONN", "mongodb://localhost:27017")
FLASK_ENV = os.environ.get("FLASK_ENV", "development")
RECAPTCHA_SECRET_KEY = os.environ["RECAPTCHA_SECRET_KEY"]

# Gunicorn config
GUNICORN_BIND = os.environ.get("GUNICORN_BIND", "0.0.0.0:5002")
GUNICORN_WORKERS = os.environ.get("GUNICORN_WORKERS", 4)
GUNICORN_TIMEOUT = os.environ.get("GUNICORN_TIMEOUT", 120)