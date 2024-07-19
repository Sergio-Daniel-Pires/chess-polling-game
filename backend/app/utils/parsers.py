from flask_restx import reqparse

new_move_vote = reqparse.RequestParser()
new_move_vote.add_argument(
    "move", type=str, help="Chess move based on fen", location="form", required=True
)
new_move_vote.add_argument(
    "game", type=str, help="Chess board game name", location="form", required=True
)