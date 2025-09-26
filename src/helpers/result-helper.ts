import { NUMBER_OF_ROWS } from "../constants";

export const generateResult = (finalHash: string): number[] => {
    const result: number[] = [];
    for (let i = 0; i < NUMBER_OF_ROWS.max; i++) {
        const start = i * 2;
        const hexChunk = finalHash.substring(start, start + 2);

        const numValue = parseInt(hexChunk, 16);
        result.push(numValue % 2);
    }

    return result;
};

export const getSettlementResult = (result: number[]): number => {
    return result.filter((num) => num === 1).length;
};
