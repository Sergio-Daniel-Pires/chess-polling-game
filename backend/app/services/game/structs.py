import dataclasses as dc
from typing import Literal
import chess
import time

from .models import ChessGame


@dc.dataclass
class CreateChessGame:
    name: str
    base_update: int
    next_update: int
    player_color: Literal["white", "black"] = dc.field(default="white")
    board: str = dc.field(default=chess.Board.starting_fen)
    last_moves: list[str] = dc.field(default_factory=list)
    fen_to_votes: dict[str, list[str, int]] = dc.field(default_factory=dict)
    finished: bool = dc.field(default=False)
    winner: Literal["humanity", "ai"] | None = dc.field(default=None)
    bot_limit: int = dc.field(default=60)

    def __post_init__(self):
        self.next_update = self.base_update

    def to_object (self):
        time_now = int(time.time() * 1000)
        
        return ChessGame(
            **self.__dict__, ctime=time_now, mtime=time_now
        )
