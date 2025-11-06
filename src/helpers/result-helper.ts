import { NUMBER_OF_ROWS } from "../constants";
import { PegMultiplier, SettlementResult } from "../types";

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

const getSlotIndex = (result: number[], row: number) => {
    return result.slice(0, row).filter((num) => num === 1).length;
};

const getReachedPegMultipliers = (result: number[], pegMultipliers?: PegMultiplier[]) => {
    return pegMultipliers?.filter((peg) => getSlotIndex(result, peg.row) === peg.column);
};

export const getSettlementResult = (
    result: number[],
    odds?: Record<number, number>,
    pegMultipliers?: PegMultiplier[]
): SettlementResult => {
    const slotIndex = result.filter((num) => num === 1).length;
    const reachedPegMultipliers = getReachedPegMultipliers(result, pegMultipliers);
    const extraMultiplier =
        reachedPegMultipliers?.reduce((acc, peg) => {
            return acc + peg.multiplier;
        }, 0) ?? 0;
    const multiplier = odds?.[slotIndex] ?? 1;
    const totalMultiplier = extraMultiplier ? multiplier * extraMultiplier : multiplier;

    return {
        slotIndex,
        multiplier: parseFloat(totalMultiplier.toFixed(3)),
        reachedPegMultipliers,
    };
};
