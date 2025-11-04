import { NUMBER_OF_ROWS } from "../constants";
import { PegMultiplier } from "../types";

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

const getExtraMultiplier = (result: number[], pegMultipliers?: PegMultiplier[]) => {
    const multiplier = pegMultipliers?.reduce((acc, peg) => {
        const slotIndex = getSlotIndex(result, peg.row);
        if (slotIndex === peg.column) {
            acc += peg.multiplier;
        }
        return acc;
    }, 0);

    return multiplier ?? 0;
};

export const getSettlementResult = (result: number[], odds?: Record<number, number>, pegMultipliers?: PegMultiplier[]) => {
    const slotIndex = result.filter((num) => num === 1).length;
    const extraMultiplier = getExtraMultiplier(result, pegMultipliers);
    const multiplier = odds?.[slotIndex] ?? 1;
    const totalMultiplier = extraMultiplier ? multiplier * extraMultiplier : multiplier;

    return {
        slotIndex,
        multiplier: parseFloat(totalMultiplier.toFixed(3)),
    };
};
