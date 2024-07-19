import json
import pytest
from unittest.mock import patch
import chess

@pytest.mark.usefixtures("redis_client")
class TestOk:
    @patch("app.services.game.methods.requests.post")
    def test_valid_vote(self, mock_post, client, redis_client):
        mock_post.return_value.json.return_value = { "success": True }

        response = client.post(
            "/game/vote", json={ "game": "Daily", "move": "e2e4", "recaptchaToken": "valid_token" }
        )
        json_data = response.get_json()

        assert response.status_code == 200, "Status code is not 200"

        assert (
            json_data["result"] == "Vote (e2e4) registered in game 'Daily'"
        ), "Wrong result message"

        assert (
            json_data["status"] == { "message": "success", "status": "ok" }
        ), "Wrong status message"

        votes = redis_client.zrange(
            f"Daily:{chess.Board.starting_fen}", 0, -1, withscores=True
        )
        assert votes == [ ( b"e2e4", 1.0 ) ], "Vote was not registered in Redis"

@pytest.mark.usefixtures("redis_client")
class TestError:
    @patch('app.services.game.methods.requests.post')
    def test_vote_invalid_recaptcha (self, mock_post, client):
        mock_post.return_value.json.return_value = { "success": False }

        response = client.post('/game/vote', data=json.dumps({
            "game": "daily",
            "move": "e2e4",
            "recaptchaToken": "invalid_token"
        }), content_type='application/json')
        json_data = response.get_json()

        assert response.status_code == 401
        assert (
            json_data["status"] == {
                "status": "error", "message": f"reCAPTCHA error: Invalid reCAPTCHA token"
            }
        ), "Wrong reCAPTCHA status message"

    @patch("app.services.game.methods.requests.post")
    def test_vote_with_invalid_move (self, mock_post, client):
        mock_post.return_value.json.return_value = { "success": True }

        response = client.post(
            "/game/vote", json={ "game": "Daily", "move": "invalid", "recaptchaToken": "valid_token" }
        )
        json_data = response.get_json()

        assert response.status_code == 400
        assert (json_data["status"] == {
            "status": "error", "message": f"Error! Invalid Move: 'invalid'"
        }), "Wrong status message"

    def test_vote_with_missing_parameters (self, client):
        response = client.post(
            "/game/vote", json={ "game": "Daily", "recaptchaToken": "valid_token" }
        )
        json_data = response.get_json()

        assert response.status_code == 400
        assert (json_data["status"] == {
            "status": "error", "message": f"ValueError Error: Invalid request, missing key: 'move'"
        }), "Wrong status message"
