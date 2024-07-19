import React from "react";
import { Button } from 'react-bootstrap';

interface MovePillProps {
    move: { move: string; fen: string };
    onClick: () => void;
}

export const MovePill: React.FC<MovePillProps> = ({ move, onClick }) => (
    <Button
        variant="outline-primary"
        className="move-pill m-1 d-flex align-items-center justify-content-center"
        onClick={onClick}
    >
        {move.move}
    </Button>
);
