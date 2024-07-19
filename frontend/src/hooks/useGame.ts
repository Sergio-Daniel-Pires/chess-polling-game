import { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import { PromotionPieceOption } from "react-chessboard/dist/chessboard/types";
import axios from 'axios';

import { keysToCamelCase } from '../api';

const backendUri = process.env.REACT_APP_URI_BACKEND;

type ObjectId = string;

interface Game {
    Id: ObjectId | string;
    name: string;
    baseUpdate: number;
    nextUpdate: number;
    playerColor: "white" | "black";
    board: string;
    lastMoves: string[];
    fenToVotes: { [key: string]: [string, number][] };
    finished: boolean;
    winner: "humanity" | "ai";
    botLimit: number;
    ctime: number;
    mtime: number;
}

const useChessGame = (
    setVote: (votes: Array<[string, number]>) => void,
    fetchVoting: (gameName: string) => Promise<void>
) => {
    const [game, setGame] = useState(new Chess());
    const [gameData, setGameData] = useState<Game>();
    const [highlightedSquares, setHighlightedSquares] = useState<Square[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [nextUpdate, setNextUpdate] = useState(0);
    const [moveList, setMoveList] = useState<Array<{ move: string, fen: string }>>([]);
    const [move, setMove] = useState<[string, string, string] | null>(null);
    const [timeRemaining, setTimeRemaining] = useState("00:00:00");
    const [boardWidth, setBoardWidth] = useState(600);

    const fetchGames = async () => {
        /* Get game names */
        try {
            const response = await axios.get(`${backendUri}/game/list-games`);
            if (response.status === 200) {
                return response.data.result.games;
            }
        } catch (error) {
            console.log("Failed to fetch games:", error);
            return []
        }
    }

    const fetchBoard = async (gameName: string | undefined) => {
    if (gameName === undefined) return;

        try {
            const response = await axios.get(`${backendUri}/game/status/game/${gameName}`);
            if (response.status === 200) {
                // Convert FEN to Chess object
                const gameData: any = keysToCamelCase(response.data.result.game)
                setGameData(gameData);

                setGame(new Chess(gameData.board));

                // Load highlighted squares from local storage
                const savedHighlightedSquares = loadHighlightedSquares(gameName, gameData.board);
                setHighlightedSquares(savedHighlightedSquares);

                // Update state with fetched data
                setIsLoading(false);
                setNextUpdate(gameData.nextUpdate);

                // Calculate move list with FENs
                setMoveList(
                    calculateMoveListWithFensAndVotes(gameData.lastMoves, gameData.fenToVotes)
                );

                // Fetch votes
                fetchVoting(gameName);
            }
        } catch (error) {
            console.error("Failed to fetch board:", error);
            setIsLoading(false);
        }

        return game.fen();
    };

    const fetchFinishedGames = async () => {
        try {
            const response = await axios.get(`${backendUri}/game/finished-games`);
            if (response.status === 200) {
                return response.data.result.games;
            }
        } catch (error) {
            console.error("Failed to fetch board:", error);
        }

        return [];
    };

    const setFinishedGame = async (gameData: any) => {
        gameData.name = `Old ${gameData.name}`
        setGameData(gameData);
        setGame(new Chess(gameData.board));

        // Calculate move list with FENs
        setMoveList(
            calculateMoveListWithFensAndVotes(gameData.lastMoves, gameData.fenToVotes)
        );

        let votes = gameData.fenToVotes[gameData.board] || [];
        setVote(votes);
    }

    const calculateTimeRemaining = () => {
        /* Use timer to refresh game when finished */
        const now = Date.now();
        const delay = 1;
        const difference = nextUpdate + (((gameData?.botLimit || 60) + delay) * 1000) - now;

        if (gameData?.name.startsWith("Old")) {
            return "00:00:00";
        }

        if (difference < 0 || (game.turn() === "b" && !gameData?.finished)) {
            const randomDelay = Math.floor(Math.random() * 1000);
            setTimeout(() => fetchBoard(gameData?.name), randomDelay);
            return "00:00:00";
        }

        const hours = Math.floor(difference / (60 * 60 * 1000));
        const minutes = Math.floor((difference % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((difference % (60 * 1000)) / 1000);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            const gameName = (await fetchGames())[0];

            if (gameName && gameName) {
                fetchBoard(gameName);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            if (gameData?.name.startsWith("Old")) {
                return "00:00:00";
            }

            const remainingTime = calculateTimeRemaining();
            setTimeRemaining(remainingTime);

            if (remainingTime === "00:00:00" || (game.turn() === "b" && gameData?.finished)) {
                const randomDelay = Math.floor(Math.random() * 1000);
                setTimeout(() => fetchBoard(gameData?.name), randomDelay);
            }
        }, 1000);
        
        return () => clearInterval(timer);
    }, [nextUpdate, gameData?.name]);

    useEffect(() => {
        /* Manual fix for table board dimension */
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 730) {
                setBoardWidth(width - 100);
            } else if (width < 1020) {
                setBoardWidth(500);
            } else {
                setBoardWidth(600);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const onDrop = (sourceSquare: Square, targetSquare: Square) => {
        /* Function that highlight squares when piece is dropped */
        try {
            const gameCopy = new Chess(game.fen());
            const move = gameCopy.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q'
            });

            if (move && !move.flags.includes('p')) {
                setMove([sourceSquare, targetSquare, ""]);
                const square = [sourceSquare, targetSquare];
                setHighlightedSquares(square);
                saveHighlightedSquares(gameData?.name, game.fen(), square);
                return true;
            }
        } catch (error) {
            console.log(error);
        }

        return false;
    };

    const calculateMoveListWithFensAndVotes = (
        moves: string[],
        fenToVotes: { key: Array<[string, number]>;[key: string]: Array<[string, number]> }
    ) => {
        const board = new Chess();

        return moves.map(move => {
            board.move(move);
            let fen = board.fen();
            let votes = fenToVotes[fen] || [];

            return { move, fen, votes };
        });
    };

    const handleMoveClick = (move: string, fen: string) => {
        /* Load board when an move button are clicked */
        const savedHighlightedSquares = loadHighlightedSquares(gameData?.name, fen);
        setHighlightedSquares(savedHighlightedSquares);

        setGame(new Chess(fen));
        if (gameData !== undefined) {
            let votes = gameData.fenToVotes[gameData.board] || [];
            setVote(votes);
        }
    };

    const saveHighlightedSquares = (
        gameName: string | undefined, fen: string, highlightedSquares: Square[]
    ) => {
        if (gameName === undefined) return;

        const savedGames = JSON.parse(localStorage.getItem("highlightedSquares") || "{}");

        if (!savedGames[gameName]) {
            savedGames[gameName] = {};
        }

        savedGames[gameName][fen] = highlightedSquares;
        localStorage.setItem("highlightedSquares", JSON.stringify(savedGames));
    };

    // Highlight squares
    const loadHighlightedSquares = (gameName: string | undefined, fen: string) => {
        if (gameName === undefined) return [];

        const savedGames = JSON.parse(localStorage.getItem("highlightedSquares") || "{}");
        return savedGames[gameName] ? savedGames[gameName][fen] || [] : [];
    };

    const handlePromotion = (
        piece?: PromotionPieceOption, sourceSquare?: Square, targetSquare?: Square
    ) => {
        /* Function to select promotion piece to vote */
        if (piece && sourceSquare && targetSquare) {
            const gameCopy = new Chess(game.fen());
            const promotion = piece[1].toLowerCase()

            try {
                gameCopy.move({
                    from: sourceSquare,
                    to: targetSquare,
                    promotion: promotion
                });

                setMove([sourceSquare, targetSquare, ""]);
                const square = [sourceSquare, targetSquare];
                setHighlightedSquares(square);
                saveHighlightedSquares(gameData?.name, game.fen(), square);

            } catch (error) {
                return false;
            }
        }

        return true;
    };

    return {
        game, highlightedSquares, isLoading, timeRemaining, boardWidth,
        moveList, move, gameData, onDrop, handleMoveClick, fetchGames,
        handlePromotion, fetchBoard, fetchFinishedGames, setFinishedGame
    };
};

export default useChessGame;
