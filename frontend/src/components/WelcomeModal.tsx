import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useTranslation, Trans } from 'react-i18next';

interface WelcomeModalProps {
    show: boolean;
    onHide: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ show, onHide }) => {
    const { t } = useTranslation();

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>{t('welcomeModal.title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    <Trans i18nKey="welcomeModal.body1">
                        Uma IA consegue derrotar qualquer humano no xadrez, mas conseguiria uma IA derrotar <strong>TODOS</strong> os humanos juntos?
                    </Trans>
                </p>
                <p>
                    <Trans i18nKey="welcomeModal.body2">
                        Bem-vindos ao experimento "Chess AI!", este é um experimento que combina a comunidade de xadrez, votação e IA!
                    </Trans>
                </p>
                <p>
                    <Trans i18nKey="welcomeModal.body3">
                        Faça estratégias, discuta em grupos, escolha a melhor jogada e faça seu voto para tentar vencer o
                        <a href="https://stockfishchess.org" target="_blank" rel="noopener noreferrer">Stockfish</a> em seu maior nível.
                    </Trans>
                </p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={onHide}>
                    {t('welcomeModal.button')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default WelcomeModal;
