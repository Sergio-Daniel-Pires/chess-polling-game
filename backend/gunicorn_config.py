import dotenv

# Load .env vars
dotenv.load_dotenv(override=False)

from app.utils import config as conf

bind = conf.GUNICORN_BIND
workers = conf.GUNICORN_WORKERS
timeout = conf.GUNICORN_TIMEOUT

loglevel = "info"

accesslog = "/dev/null"
errorlog = "/dev/null"
