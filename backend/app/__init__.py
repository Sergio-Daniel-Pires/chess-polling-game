# isort: off
# load env vars
from dotenv import load_dotenv
load_dotenv(override=False)

# isort: on
import os

from app.services.game.views import move_ns
from app.utils.games import LocalGameManager
from apscheduler.schedulers.background import BackgroundScheduler
from flask import Flask
from flask_cors import CORS
from flask_restx import Api

# Create flask swagger API
api = Api(
    title="Flask + Swagger",
    description="A flask factories server template ready to deploy with Swagger documentation",
    version="0.1.0",
    doc="/docs"
)

# Configure flask cors 
cors = CORS()

# Create chess games and start timer
chess_games = LocalGameManager()
scheduler = BackgroundScheduler()

SECONDS_IN_HOUR = 3600
SECONDS_IN_DAY = SECONDS_IN_HOUR * 24

def create_app() -> Flask:
    """
    Creates Flask app
    """

    # Verify recaptcha secret key
    recaptcha_secret_key = os.environ.get("RECAPTCHA_SECRET_KEY")
    if recaptcha_secret_key is None or recaptcha_secret_key == "":
        raise ValueError("Missing RECAPTCHA_SECRET_KEY in environment, exiting...")

    app = Flask(__name__)

    app.config["CORS_HEADERS"] = "Content-Type"

    # Add routes
    # Game handler route
    api.add_namespace(move_ns, path="/game")

    api.init_app(app)
    cors.init_app(app)

    # Create chess games
    chess_games.add_game("Daily", SECONDS_IN_DAY, next_update=(SECONDS_IN_DAY//2))
    # chess_games.add_game("6 Hours", SECONDS_IN_HOUR * 6)

    scheduler.add_job(
        chess_games.verify_games_to_update, "interval",
        seconds=chess_games.shorter_update_time
    )

    scheduler.start()

    return app

if __name__ == "__main__":
    app = create_app()
    app.run()

    scheduler.shutdown()
