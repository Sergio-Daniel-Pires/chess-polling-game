import { useState } from "react";
import { Chess, Square } from "chess.js";

export const useBoardState = () => {
    const [game, setGame] = useState(new Chess());
    const [highlightedSquares, setHighlightedSquares] = useState<Square[]>([]);

    return [game, setGame, highlightedSquares, setHighlightedSquares] as const;
};
