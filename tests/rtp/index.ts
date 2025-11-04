import { SeedHelper, ServerSeedHelper } from "sc-game-base/src/core/helpers";
import { generateResult, getSettlementResult } from "../../src/helpers/result-helper";

const odds: Record<number, Record<number, number[]>> = {
    "0": {
        "8": [5.6, 1.9, 1.1, 1, 0.5, 1, 1.1, 1.9, 5.6],
        "9": [5.6, 2, 1.5, 1, 0.7, 0.7, 1, 1.5, 2, 5.6],
        "10": [8.9, 2.8, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 2.8, 8.9],
        "11": [8.4, 2.9, 1.7, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.7, 2.9, 8.4],
        "12": [10, 3, 1.5, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.5, 3, 10],
        "13": [8.1, 4, 3, 1.7, 1.2, 0.9, 0.7, 0.7, 0.9, 1.2, 1.7, 3, 4, 8.1],
        "14": [7.1, 4, 1.9, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.9, 4, 7.1],
        "15": [15, 8, 3, 1.8, 1.4, 1.1, 1, 0.7, 0.7, 1, 1.1, 1.4, 1.8, 3, 8, 15],
        "16": [16, 8, 1.5, 1.4, 1.3, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 8, 16],
    },
    "1": {
        "8": [13, 2.8, 1.3, 0.7, 0.4, 0.7, 1.3, 2.8, 13],
        "9": [18, 4, 1.6, 0.9, 0.5, 0.5, 0.9, 1.6, 4, 18],
        "10": [22, 5.2, 1.8, 1.4, 0.6, 0.4, 0.6, 1.4, 1.8, 5.2, 22],
        "11": [24, 6, 3, 1.7, 0.7, 0.5, 0.5, 0.7, 1.7, 3, 6, 24],
        "12": [33, 11, 3.6, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 3.6, 11, 33],
        "13": [43, 14, 5, 3, 1.3, 0.7, 0.4, 0.4, 0.7, 1.3, 3, 5, 14, 43],
        "14": [58, 14, 6, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 6, 14, 58],
        "15": [88, 18, 9, 5, 3, 1.3, 0.5, 0.3, 0.3, 0.5, 1.3, 3, 5, 9, 18, 88],
        "16": [110, 40, 7, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 7, 40, 110],
    },
    "2": {
        "8": [29, 3.8, 1.5, 0.3, 0.2, 0.3, 1.5, 3.8, 29],
        "9": [43, 7, 1.9, 0.6, 0.2, 0.2, 0.6, 1.9, 7, 43],
        "10": [76, 11, 2.6, 0.9, 0.3, 0.2, 0.3, 0.9, 2.6, 11, 76],
        "11": [120, 13, 5.1, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 5.1, 13, 120],
        "12": [170, 22, 8, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8, 22, 170],
        "13": [260, 39, 10, 4, 1, 0.2, 0.2, 0.2, 0.2, 1, 4, 10, 39, 260],
        "14": [420, 62, 16, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 16, 62, 420],
        "15": [620, 84, 25, 8, 3, 0.5, 0.2, 0.2, 0.2, 0.2, 0.5, 3, 8, 25, 84, 620],
        "16": [1000, 136, 22, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 22, 136, 1000],
    },
};
const settle = (mode: number, numberOfRows: number, gameMode: number) => {
    const clientSeed = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    const serverSeed = ServerSeedHelper.generateServerSeed(mode);
    const finalHash = SeedHelper.getSHA512Hash(serverSeed + clientSeed);
    const result = generateResult(finalHash);
    const { multiplier } = getSettlementResult(result.slice(0, numberOfRows), odds[gameMode][numberOfRows]);
    return multiplier;
};
const TOTAL_RUNS = 1_000_000;
const calculateRTP = (mode: number, numberOfRows: number, gameMode: number): number => {
    let totalWin = 0;
    for (let i = 0; i < TOTAL_RUNS; i++) {
        const multiplier = settle(mode, numberOfRows, gameMode);
        totalWin += multiplier;
    }
    return (totalWin / TOTAL_RUNS) * 100;
};

const initializeStatisticStructure = (
    modes: number[],
    numberOfRows: number[],
    gameModes: number[]
): Record<number, Record<number, Record<number, number>>> => {
    const statistic: Record<number, Record<number, Record<number, number>>> = {};
    modes.forEach((mode) => {
        statistic[mode] = {};
        gameModes.forEach((gameMode) => {
            statistic[mode][gameMode] = {};
            numberOfRows.forEach((rows) => {
                statistic[mode][gameMode][rows] = 0;
            });
        });
    });
    return statistic;
};

const runSimulations = (
    statistic: Record<number, Record<number, Record<number, number>>>,
    modes: number[],
    numberOfRows: number[],
    gameModes: number[]
): void => {
    modes.forEach((mode) => {
        gameModes.forEach((gameMode) => {
            numberOfRows.forEach((rows) => {
                const rtp = calculateRTP(mode, rows, gameMode);
                statistic[mode][gameMode][rows] = rtp;
            });
        });
    });
};

const run = () => {
    const randomMode = [0, 1, 2];
    const randomNumberOfRows = [8, 9, 10, 11, 12, 13, 14, 15, 16];
    const randomGameMode = [0, 1, 2];

    const statistic = initializeStatisticStructure(randomMode, randomNumberOfRows, randomGameMode);
    runSimulations(statistic, randomMode, randomNumberOfRows, randomGameMode);
    console.log(JSON.stringify(statistic, null, 2));
};

run();
