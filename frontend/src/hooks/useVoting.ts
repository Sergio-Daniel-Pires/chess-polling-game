import { useState } from "react";
import axios from "axios";

export const useVoting = () => {
    const [votes, setVotes] = useState<Array<[string, number]>>([]);
    const backendUri = process.env.REACT_APP_URI_BACKEND;

    const fetchVoting = async (gameName: string | undefined) => {
        if (gameName === undefined || gameName.startsWith("Old")) return;

        try {
            const response = await axios.get(`${backendUri}/game/status/voting/${gameName}`);
            if (response.status === 200) {
                setVotes(response.data.result.voting);
            }
        } catch (error) {
            console.error("Failed to fetch voting:", error);
        }
    };

    const setVote = async (votes: Array<[string, number]>) => {
        setVotes(votes);
    }

    return [votes, setVote, fetchVoting] as const;
};
