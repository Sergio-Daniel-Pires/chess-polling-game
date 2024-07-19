import React, { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Alert, Button, Col, Container, Row } from 'react-bootstrap';
import { Chart } from 'react-google-charts';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { useTranslation } from 'react-i18next';


// @ts-ignore
import ReCAPTCHA from 'react-google-recaptcha';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import { PlayerInfo } from "./components/PlayerInfo";
import { MovePill } from "./components/MovePill";
import WelcomeModal from './components/WelcomeModal';
import MatchesModal from './components/MatchesModal';
import AboutModal from './components/AboutModal';

import { useVoting } from './hooks/useVoting';
import useChessGame from './hooks/useGame';
import useRecaptcha from './hooks/useRecaptcha';
import useSendVote from './hooks/useSendVote';

function App() {
  const { t, i18n } = useTranslation();
  const [votes, setVote, fetchVoting] = useVoting();
  const [chartData, setChartData] = useState<any[]>([]);

  // Modal states
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showMatchesModal, setShowMatchesModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const [gamesName, setGamesName] = useState<string[]>([]);

  const {
    game, highlightedSquares, isLoading, timeRemaining, boardWidth,
    moveList, move, gameData, onDrop, handleMoveClick, fetchGames,
    handlePromotion, fetchBoard, fetchFinishedGames, setFinishedGame
  } = useChessGame(setVote, fetchVoting);

  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const {
    recaptchaToken, recaptchaSiteKey, handleRecaptchaChange, resetRecaptcha
  } = useRecaptcha(recaptchaRef);

  const { voteAlert, setVoteAlert, handleSendVote } = useSendVote(
    recaptchaSiteKey, recaptchaToken, resetRecaptcha, fetchVoting, gameData?.name, move
  );

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    localStorage.setItem("hasSeenWelcomeModal", "true");
  };

  useEffect(() => {
    if (!localStorage.getItem("hasSeenWelcomeModal")) {
      setShowWelcomeModal(true);
    }
  }, []);

  useEffect(() => {
    const userLang = navigator.language;

    if (userLang.startsWith("pt")) {
      i18n.changeLanguage("pt");
    } else {
      i18n.changeLanguage("en");
    }
  }, [i18n]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchVoting(gameData?.name);
    }, 10000);

    return () => clearInterval(timer);
  }, [gameData?.name, fetchVoting]);

  // Highlight squares
  const customSquareStyles: { [key: string]: React.CSSProperties } = {};
  highlightedSquares.forEach((square) => {
    customSquareStyles[square] = {
      backgroundColor: "rgba(0, 255, 0, 0.5)"
    };
  });

  // Chart data for most voted moves
  const chartOptions = {
    legend: { position: "none" },
    bar: { groupWidth: "75%" },
  };

  useEffect(() => {
    // Calculate vote percentages
    const totalVotes = votes.reduce((acc, vote) => acc + vote[1], 0);
    const votePercentages = votes.map(
      ([move, count]: [string, number]) => [move, totalVotes ? (count / totalVotes) * 100 : 0]
    );

    // Add N/A votes to fill the chart
    while (votePercentages.length < 3) { votePercentages.push(["N/A", 0]); }

    const chartData: any[] = [
      ["Move", "Votes", { role: "style" }, { role: "annotation" }],
      ...votePercentages.map(([move, percentage], index) => [
        move,
        votes[index] ? votes[index][1] : 0,
        index === 0 ? "color: #4caf50" : index === 1 ? "color: #ff9800" : "color: #f44336",
        votes[index] ? votes[index][1] : 0
      ])
    ];

    setChartData(chartData);
  }, [votes]);

  useEffect(() => {
    fetchGames().then((games) => {
      setGamesName(games);
    });
  }, []);

  return (
    <Container fluid>
      {/* Show alert on vote sucess */}
      {voteAlert && (
        <Alert
          variant="success"
          onClick={() => setVoteAlert(false)}
          dismissible
          className="fixed-top w-50 mx-auto mt-3 fade show"
        >
          {t('voteAlert.voteRegistered')}
        </Alert>
      )}
      {/* Modals */}
      <WelcomeModal show={showWelcomeModal} onHide={handleCloseWelcomeModal} />
      <MatchesModal
        show={showMatchesModal}
        onHide={() => setShowMatchesModal(false)}
        fetchFinishedGames={fetchFinishedGames}
        setFinishedGame={setFinishedGame}
      />
      <AboutModal show={showAboutModal} onHide={() => setShowAboutModal(false)} />

      <Row className="p-3">
        <Col md={8} className="d-flex flex-column p-3">
          <Row className="d-flex align-items-center justify-content-between">
            <div className="d-flex p-3">
              {gamesName.map((gameName, index) => (
                <Button
                  key={index}
                  variant={gameData?.name === gameName ? "secondary" : "primary"}
                  onClick={() => fetchBoard(gameName)}
                  className={`mx-2 w-auto ${gameData?.name === gameName ? "active" : ""}`}
                >
                  {gameName}
                </Button>
              ))}
              <Button
                variant="outline-secondary"
                className="ms-auto w-auto"
                onClick={() => setShowMatchesModal(true)}
              >
                {t('nav.matches')}
              </Button>
              <Button
                variant="outline-secondary"
                className="ms-2 w-auto"
                onClick={() => setShowAboutModal(true)}
              >
                {t('nav.about')}
              </Button>
            </div>
          </Row>
          <PlayerInfo
            row="flex-row"
            name="Stockfish"
            imgSrc="https://placehold.co/150x150"
          />
          <Row className="d-flex align-self-center my-3">
            <Col className="d-flex justify-content-center">
              {!isLoading &&
                <Chessboard
                  position={game.fen()}
                  onPieceDrop={onDrop}
                  boardOrientation="white"
                  customSquareStyles={customSquareStyles}
                  boardWidth={boardWidth}
                  onPromotionPieceSelect={handlePromotion}
                />
              }
              {isLoading && <p>{t('loading')}...</p>}
            </Col>
          </Row>
          <PlayerInfo
            row="flex-row-reverse"
            name={t('player')}
            imgSrc="https://placehold.co/150x150"
          />
        </Col>
        <Col md={4} className="text-center sidebar p-3 d-flex flex-column justify-content-around">
          <div>
            <h1>{t('chessAI')}</h1>
            <h1>{timeRemaining}</h1>
          </div>
          <div>
            <h3>{t('movesList')}</h3>
            <div className="moves-list d-flex flex-wrap">
              {moveList.map((moveData, index) => (
                <MovePill
                  key={index}
                  move={moveData}
                  onClick={() => handleMoveClick(moveData.move, moveData.fen)}
                />
                ))}
            </div>
          </div>
          {gameData?.finished && (
            <div className="alert alert-info mt-3">
              <h2>{t('gameFinished')}</h2>
              <p>{t('winner', { winner: gameData?.winner === "humanity" ? "Humanity" : "AI" })}</p>
              <p>{t('totalMoves', { moveCount: moveList.length })}</p>
              <p>{t('waitingNextGame')}</p>
            </div>
          )}
          {!gameData?.finished &&
            <div>
              <h2>{t('mostVotedMoves')}</h2>
              <Chart
                chartType="Bar"
                width="100%"
                height="200px"
                data={chartData}
                options={chartOptions}
                />
            </div>
          }
          {!gameData?.finished &&
            <div>
              <Row className="d-flex align-self-center">
                <Col className="d-flex justify-content-center">
                  {recaptchaSiteKey && (
                    <ReCAPTCHA
                      sitekey={recaptchaSiteKey}
                      onChange={handleRecaptchaChange}
                      ref={recaptchaRef}
                      />
                    )}
                </Col>
              </Row>
              <Button
                className="w-75 align-self-center"
                variant="success"
                onClick={handleSendVote}
              >
                {t('sendVote')}
              </Button>
            </div>
          }
        </Col>
      </Row>
    </Container>
  );
}

export default App;
