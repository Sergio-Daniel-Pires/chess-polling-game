from typing import Any

import requests
from app.utils import config
from app.utils.errors import RecaptchaError
from app.utils.games import LocalGameManager

chess_games = LocalGameManager()

def verify_save_vote (user_data: dict[str, Any]):
    for key in ( "game", "move" ):
        if key not in user_data:
            raise ValueError(f"Invalid request, missing key: '{key}'")

    if config.FLASK_ENV != "development":
        recaptcha_token = user_data.get('recaptchaToken')

        if recaptcha_token is None:
            raise RecaptchaError("Recaptcha token is required")

        recaptcha_response = requests.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={ "secret": config.RECAPTCHA_SECRET_KEY, "response": recaptcha_token  }
        )
        recaptcha_result = recaptcha_response.json()

        if not recaptcha_result.get("success"):
            raise RecaptchaError("Invalid reCAPTCHA token")

    game = user_data["game"]
    move = user_data["move"]

    chess_games.vote(game, move)

    return f"Vote ({move}) registered in game '{game}'"
