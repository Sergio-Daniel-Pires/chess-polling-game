import React from 'react';
import { Modal, Button, Row, Image } from 'react-bootstrap';
import { useTranslation, Trans } from 'react-i18next';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

interface AboutModalProps {
    show: boolean;
    onHide: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ show, onHide }) => {
    const { t } = useTranslation();

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>{t('aboutModal.title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex p-1">
                    <div className="w-auto">
                        <Image src="https://avatars.githubusercontent.com/u/91979267?s=400&u=e50f315f3287318512a23dd248f18d6e4a4c621c&v=4" roundedCircle height={150} />
                    </div>
                    <div className="w-auto px-3">
                        <h3>Sérgio "Regios" Pires</h3>
                        <p>{t('aboutModal.description')}</p>
                    </div>
                </div>
                <hr/>
                <Row className="p-1">
                    <p className="text-justify">
                        <Trans i18nKey="aboutModal.kasparovVsDeepBlue" className="text-justify">
                            In 1997, Garry Kasparov faced IBM's supercomputer Deep Blue, marking the first defeat of a world champion by a computer in standard conditions. Deep Blue won 3.5 to 2.5, sparking discussions on the future of AI in chess.
                        </Trans>
                    </p>
                    <p className="text-justify">
                        <Trans i18nKey="aboutModal.kasparovVsWorld">
                            In 1999, Garry Kasparov played against thousands of online participants in a match called 'Kasparov vs. The World.' The game lasted four months, with players voting on moves. Kasparov won, demonstrating his unmatched strategic skills.
                        </Trans>
                    </p>
                    <hr/>
                </Row>
                <p>{t('aboutModal.findMeOn')}</p>
                <Row className="d-flex px-2">
                    <Button
                        variant="dark"
                        href="https://github.com/Sergio-Daniel-Pires/chess-polling-game"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 m-1 w-auto"
                    >
                        <FaGithub className="mb-1" /> {t('sourceCode')}
                    </Button>
                    <Button
                        variant="dark"
                        href="https://github.com/Sergio-Daniel-Pires"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 m-1 w-auto"
                    >
                        <FaGithub className="mb-1" /> GitHub
                    </Button>
                    <Button
                        variant="info"
                        href="https://www.linkedin.com/in/sergio-daniel-pires-2582271b9/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 m-1 w-auto"
                    >
                        <FaLinkedin className="mb-1" /> LinkedIn
                    </Button>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    {t('close')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AboutModal;
