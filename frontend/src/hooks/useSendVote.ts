import axios from 'axios';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const backendUri = process.env.REACT_APP_URI_BACKEND;

const useSendVote = (
    recaptchaSiteKey: string | undefined, recaptchaToken: string | null,
    resetRecaptcha: () => void, fetchVoting: (gameName: string | undefined) => Promise<void>,
    currentGameName: string | undefined, move: [string, string, string] | null
) => {
    const [voteAlert, setVoteAlert] = useState(false);
    const { t } = useTranslation();

    const handleSendVote = async () => {
        if (recaptchaSiteKey && !recaptchaToken) {
            alert(t('alertsErrors.emptyRecaptcha'));
            return;
        }

        if (move === null) {
            alert(t('alertsErrors.emptyMove'));
            return;
        }

        const payload: {
            move: string | null, game: string | undefined, recaptchaToken?: string | null
        } = {
            move: `${move[0]}${move[1]}${move[2]}`, game: currentGameName,
        };

        if (recaptchaSiteKey) {
            payload.recaptchaToken = recaptchaToken;
        }

        if (move) {
            try {
                await axios.post(
                    `${backendUri}/game/vote`, payload,
                    { headers: { "Content-Type": "application/json" } }
                );
                setVoteAlert(true);
                setTimeout(() => setVoteAlert(false), 3000);
                fetchVoting(currentGameName);
                resetRecaptcha()
            } catch (error) {
                console.error(error);
            }
        }
    };

    return {
        voteAlert, setVoteAlert, handleSendVote
    };
};

export default useSendVote;
