import json
import logging
import random
import time
from abc import ABC, abstractmethod
from typing import Any
import pymongo
import pymongo.database
import pymongo.collection

import chess
import chess.engine
import redis

from app.services.game.models import ChessGame
from app.services.game.structs import CreateChessGame
from app.utils import config

class GamesManager(ABC):
    shorter_update_time: int = 1
    mongo_client: pymongo.MongoClient
    chess_db: pymongo.database.Database
    games_collection: pymongo.collection.Collection

    redis_client: redis.Redis

    @property
    @abstractmethod
    def games (self) -> dict[str, ChessGame]:
        """
        Get games from redis
        """

    @games.setter
    def games (self) -> None:
        raise ValueError("Cannot set games directly, use 'add_game' or 'update_game' instead.")

    @abstractmethod
    def get_games (self) -> list[str]:
        """
        Get registered names in redis

        :return: List of game names
        """

    @abstractmethod
    def add_game (self, name: str, base_update: int, next_update: int = None) -> None:
        """
        Add a game

        :param name: Game name
        :param base_update: Base update time in seconds (like 60 for 1 minute)
        :param next_update: Next update, defaults to None (time now + base_update will be used)
        """

    @abstractmethod
    def get_game (self, name: str) -> ChessGame:
        """
        Get a game from name

        :param name: Game name
        :return: Game Object
        """

    @abstractmethod
    def update_game (self, game: str, move: str, next_update: int) -> ChessGame:
        """
        Update a game with a move

        :param game: Game name
        :param move: Move in UCI format
        :param next_update:
        :return: _description_
        """

    def verify_move (self, game: str, move: str):
        """
        Verify if a move is valid for a game

        :param game: Game name
        :param move: move in UCI format
        :raises chess.InvalidMoveError: Raise for illegal moves and trying to move on the wrong turn
        """
        current_game = self.get_game(game)
        game_board = chess.Board(current_game.board)

        try:
            chess_move = chess.Move.from_uci(move)

            # Raise for illegal moves and trying to move on the wrong turn
            is_player_turn = (
                (current_game.player_color == "white" and game_board.turn == chess.WHITE)
                or (current_game.player_color == "black" and game_board.turn == chess.BLACK)
            )

            if (
                chess_move not in game_board.legal_moves or not is_player_turn
            ):
                raise chess.InvalidMoveError(move)

        except Exception as exc:
            logging.error(exc)

            raise chess.InvalidMoveError(move)

    def vote (self, game: str, move: str):
        """
        Vote for a move in a game

        :param game: Game name
        :param move: Move in UCI format
        """
        self.verify_move(game, move)

        curent_game = self.get_game(game)

        self.redis_client.zincrby(curent_game.voting_key, 1, move)

    def get_top_n (self, game: str, n: int = 3) -> list[tuple[str, float]]:
        """
        Get the top N voted moves for a game

        :param game: Game name
        :param n: N top voted moves, defaults to 3
        :return: Sorted list of tuples with move and score
        """
        curent_game = self.get_game(game)

        return [
            ( move.decode("utf8"), int(score) ) for move, score in
            self.redis_client.zrevrange(curent_game.voting_key, 0, n-1, withscores=True)
        ]

    def register_moves (self, game: str):
        """
        Register top players move and make a move for the AI

        :param game: Game name
        """
        top_moves = self.get_top_n(game, 3)

        # Get most voted move or random move if theres no votes
        top_move = None

        if len(top_moves) > 0:
            top_move = top_moves[0][0]

        current_game: ChessGame = self.update_game(game, top_move, top_moves)

        if current_game.finished:
            return

        # AI move
        # Stockfish config
        engine = chess.engine.SimpleEngine.popen_uci("/usr/games/stockfish")
        engine.configure({ "Skill Level": 20 })

        # Stockfish move
        ai_move = engine.play(
            chess.Board(current_game.board), chess.engine.Limit(current_game.bot_limit)
        )
        self.update_game(game, ai_move.move, [])

    def verify_games_to_update (self):
        for game_name, game in self.games.items():
            seconds_remaining = ((game.next_update - int(time.time() * 1000)) / 1000)

            if seconds_remaining <= game.bot_limit:
                if game.finished:
                    # Delete voting keys by fen (default fen included)
                    for game_fen in game.fen_to_votes:
                        voting_key = f"{game_name}:{game_fen}"
                        self.redis_client.delete(voting_key)

                    self.save_finished_game(game)
                    # Reset game and counters
                    game.reset()

                    games = self.games
                    games[game_name] = game
                    self.redis_client.set(
                        self.games_key,
                        json.dumps({ k: v.__dict__ for k, v in games.items() }, default=str)
                    )

                else:
                    self.register_moves(game_name)

    def save_finished_game (self, game: ChessGame):
        self.games_collection.insert_one(game.to_insert())

    def get_old_matches (self, n: int = 3, game_name: str = "Daily"):
        return json.loads(json.dumps(list(self.games_collection.find(
            { "name": game_name },
        ).limit(n).sort("ctime", pymongo.DESCENDING)), default=str))

class LocalGameManager (GamesManager):
    games_key: str
    redis_client: redis.Redis
    mongo_client: pymongo.MongoClient

    def __init__ (self, games: dict[str, Any] = None):
        self.games_key = "games1"

        self.redis_client = redis.StrictRedis(config.REDIS_CONN)

        self.mongo_client = pymongo.MongoClient(config.MONGO_CONN)
        self.chess_db = self.mongo_client["chess"]
        self.games_collection = self.chess_db["games"]

        self.redis_client.delete(self.games_key)
        if self.redis_client.get(self.games_key) is None:
            games = games or {}
            self.redis_client.set(self.games_key, json.dumps(games, default=str))

    @property
    def games (self) -> dict[str, ChessGame]:
        return {
            name: ChessGame(**game)
            for name, game in json.loads(self.redis_client.get(self.games_key)).items()
        }

    def get_games (self) -> list[str]:
        return list(self.games.keys())

    def add_game (
        self, name: str, base_update: int, next_update: int = None, bot_limit: int = 60
    ) -> None:
        if self.shorter_update_time is None or self.shorter_update_time > (base_update // 2):
            self.shorter_update_time = base_update // 2
            logging.info("Shorter update time set to %s", self.shorter_update_time)

        games = self.games
        new_game = CreateChessGame(
            name, base_update, next_update, bot_limit=bot_limit
        ).to_object()
        new_game.set_timer()

        games[name] = new_game

        self.redis_client.set(
            self.games_key, json.dumps({ k: v.__dict__ for k, v in games.items() }, default=str)
        )

    def get_game (self, name: str) -> ChessGame:
        if name not in self.games:
            raise ValueError(f"Game '{name}' not found")

        return self.games[name]

    def update_game (
        self, game: str, top_move: str | chess.Move | None, top_moves: list[str, int] = []
    ) -> ChessGame:
        current_game = self.get_game(game)
        current_board = chess.Board(current_game.board)

        # No votes, get random move
        if top_move is None:
            top_move = random.choice(list(current_board.legal_moves))

        if isinstance(top_move, str):
            top_move = chess.Move.from_uci(top_move)

        # Update last moves and fen -> vote 
        current_game.fen_to_votes[current_board.fen()] = top_moves

        current_board.push(top_move)

        current_game.next_update = int(time.time() * 1000) + (current_game.base_update * 1000)
        current_game.last_moves.append(top_move.uci())
        current_game.board = current_board.fen()

        if current_board.is_checkmate():
            current_game.finished = True
            # BUG fix winner for players playing with blacks
            current_game.winner = "ai" if current_board.turn == chess.WHITE else "humanity"

        games = self.games
        games[game] = current_game
        self.redis_client.set(
            self.games_key, json.dumps({ k: v.__dict__ for k, v in games.items() }, default=str)
        )

        return current_game
