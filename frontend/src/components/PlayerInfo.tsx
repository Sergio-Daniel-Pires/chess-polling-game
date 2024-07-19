import React from "react";
import { Row, Col, Image } from 'react-bootstrap';

interface PlayerInfoProps {
    row: string;
    imgSrc: string;
    name: string;
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({ row, imgSrc, name }) => (
    <Row className={'player-info d-flex mx-1 py-1 row'}>
        <Col className={`d-flex ${row} justify-content-start`}>
            <Image roundedCircle src={imgSrc} height={60} />
            <p className="m-2">{name}</p>
        </Col>
    </Row>
);
