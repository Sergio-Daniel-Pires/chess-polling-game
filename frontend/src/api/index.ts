import axios from "axios";

const backendUri = process.env.REACT_APP_URI_BACKEND;

const toCamelCase = (str: string): string => {
    return str.replace(/([-_][a-z])/gi, (group) =>
        group
            .toUpperCase()
            .replace('-', '')
            .replace('_', '')
    );
};

export const keysToCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map((v) => keysToCamelCase(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((result: any, key: string) => {
            result[toCamelCase(key)] = keysToCamelCase(obj[key]);
            return result;
        }, {});
    }
    return obj;
};

export const fetchGames = async () => {
    try {
        const response = await axios.get(`${backendUri}/game/list-games`);
        if (response.status === 200) {
            return response.data.result.games;
        }
    } catch (error) {
        console.log("Failed to fetch games:", error);
        return [];
    }
};

export const fetchBoard = async (gameName: string) => {
    try {
        const response = await axios.get(`${backendUri}/game/status/game/${gameName}`);

        if (response.status === 200) {
            return response.data.result.game;
        }
    } catch (error) {
        console.error("Failed to fetch board:", error);
        return null;
    }
};


