import { FC, useEffect, useState } from 'react';
import { Modal, Button, Card, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import { keysToCamelCase } from '../api';

interface MatchesModalProps {
    show: boolean;
    onHide: () => void;
    fetchFinishedGames: () => Promise<any[]>;
    setFinishedGame: (gameData: any) => void;
}

const MatchesModal: FC<MatchesModalProps> = (
    { show, onHide, fetchFinishedGames, setFinishedGame }
) => {
    const { t } = useTranslation();
    const [matches, setMatches] = useState<any[]>([]);

    useEffect(() => {
        const fetchMatches = async () => {
            const fetchedMatches = await fetchFinishedGames();
            setMatches(fetchedMatches);
        };

        fetchMatches();
    }, []);

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>{t('matchesModal.title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {matches.map((match, index) => (
                    <Card key={index} className="mb-2">
                        <Card.Body>
                            <Row className="justify-content-between">
                                <div className="w-auto">
                                    <h5>{match.name}</h5>
                                    <Card.Text className="w-auto mb-0">
                                        {t('matchesModal.moves')}: {match.last_moves.length || 0}
                                    </Card.Text>
                                    <Card.Text className="w-auto mb-0">
                                        {t('matchesModal.winner')}: {match.winner}
                                    </Card.Text>
                                </div>
                                <div className="d-flex w-auto align-items-center">
                                    <Button
                                        onClick={() => setFinishedGame(keysToCamelCase(match))}
                                        variant="primary">{t('matchesModal.viewMatch')}
                                    </Button>
                                </div>
                            </Row>
                        </Card.Body>
                    </Card>
                ))}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>{t('close')}</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default MatchesModal;
