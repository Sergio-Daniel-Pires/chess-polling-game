import logging
import traceback
from collections.abc import Callable

import chess
import flask
from app.utils.errors import RecaptchaError


def middleware (f: Callable) -> Callable:
    def wrapper(*args, **kwargs):
        status_code = 200
        response = { "result": None, "status": { "message": "success", "status": "ok" } }

        try:
            result = f(*args, **kwargs)

            # Return file
            if isinstance(result, flask.Response):
                return result

            response["result"] = result

        except chess.InvalidMoveError as exc:
            logging.error(traceback.format_exc())
            status_code = 400
            response["status"] = { "status": "error", "message": f"Error! Invalid Move: '{exc}'" }

        except RecaptchaError as exc:
            logging.error(traceback.format_exc())
            status_code = 401
            response["status"] = { "status": "error", "message": f"reCAPTCHA error: {exc}" }

        except Exception as exc:
            # Pretty error on server-side
            logging.error(traceback.format_exc())
            status_code = 400
            response["status"] = {
                "status": "error", "message": f"{type(exc).__name__} Error: {exc}"
            }

        # Return json
        return response, status_code

    return wrapper
