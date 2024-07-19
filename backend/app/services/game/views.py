import json

import flask
from app.utils.games import LocalGameManager
from app.utils.middleware import middleware
from app.utils.parsers import new_move_vote
from flask_restx import Namespace, Resource

from .methods import verify_save_vote

move_ns = Namespace("Move", description="Flask route to handle users moves")

chess_games = LocalGameManager()

@move_ns.route("/vote")
class HandleMove(Resource):
    @move_ns.doc(expect=[ new_move_vote ])
    @middleware
    def post(self):
        user_data = dict(flask.request.form)
        try:
            user_data.update(json.loads(flask.request.data))

        except:
            ...

        return verify_save_vote(user_data)

@move_ns.route("/list-games")
class GameBoard(Resource):
    @middleware
    def get(self):
        return { "games": chess_games.get_games() }
    
@move_ns.route("/finished-games")
class GameBoard(Resource):
    @middleware
    def get(self):
        return { "games": chess_games.get_old_matches() }

@move_ns.route("/status/game/<game>")
class GameBoard(Resource):
    @middleware
    def get(self, game: str):
        return {
            "game": chess_games.get_game(game).__dict__,
            "voting": chess_games.get_top_n(game)
        }

@move_ns.route("/status/voting/<game>")
class GameBoard(Resource):
    @middleware
    def get(self, game: str):
        return {
            "voting": chess_games.get_top_n(game)
        }
