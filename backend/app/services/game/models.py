import dataclasses as dc
from typing import Literal
import chess
import time
import bson

@dc.dataclass()
class ChessGame:
    _id: bson.ObjectId | str = dc.field(default=None)
    name: str = dc.field(default=None)
    base_update: int = dc.field(default=None)
    next_update: int = dc.field(default=None)
    player_color: Literal["white", "black"] = dc.field(default=None)
    board: str = dc.field(default=None)
    last_moves: list[str] = dc.field(default=None)
    fen_to_votes: dict[str, list[str, int]] = dc.field(default=None)
    finished: bool = dc.field(default=None)
    winner: Literal["humanity", "ai"] | None = dc.field(default=None)
    bot_limit: int = dc.field(default=None)

    ctime: int | float = dc.field(default=None)
    mtime: int | float = dc.field(default=None)

    @property
    def voting_key (self) -> str:
        return f"{self.name}:{self.board}"

    def reset (self):
        self.board = chess.Board.starting_fen
        self.last_moves = []
        self.finished = False
        self.winner = None
        self.next_update = None

        self.set_timer()

    def set_timer (self):
        # Set next move as base_update if not set
        if self.next_update is None:
            self.next_update = int(time.time() * 1000) + ( self.base_update * 1000 )

        # Set next move as unix time if next_update
        elif self.next_update <= int(time.time() * 1000):
            self.next_update = int(time.time() * 1000) + ( self.next_update * 1000 )

    def to_insert (self):
        # Remove bson support
        result = self.__dict__

        result.pop("_id")

        return result
