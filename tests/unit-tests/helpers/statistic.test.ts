import { SeedHelper, ServerSeedHelper } from "sc-game-base/src/core/helpers";
import { generateResult, getSettlementResult } from "../../../src/helpers/result-helper";

describe("Statistic run 100,000 times", () => {
    const totalRuns = 100_000;
    const randomModes = [1, 2, 3];
    const binomial = (n: number, k: number) => {
        if (k > n) return 0;
        let result = 1;
        for (let i = 0; i < k; i++) {
            result *= (n - i) / (i + 1);
        }
        return result;
    };

    const calculateProbability = (n: number, k: number) => {
        const binom = binomial(n, k);
        const totalPossibilities = Math.pow(2, n);
        return binom / totalPossibilities;
    };

    const getPlinkoProbabilities = (n: number) => {
        const probabilities: Record<number, number> = {};
        for (let k = 0; k <= n; k++) {
            probabilities[k] = calculateProbability(n, k) * 100;
        }
        return probabilities;
    };

    const getFinalHash = (mode: number) => {
        const clientSeed = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0");
        const serverSeed = ServerSeedHelper.generateServerSeed(mode);
        const mergeSeed = serverSeed + clientSeed;
        return SeedHelper.getSHA512Hash(mergeSeed);
    };
    const run = (mode: number, numberOfRows: number) => {
        const finalHash = getFinalHash(mode);
        const result = generateResult(finalHash);
        return getSettlementResult(result.slice(0, numberOfRows));
    };

    const numberOfRow = 16;
    const probabilities = getPlinkoProbabilities(numberOfRow);
    console.log(JSON.stringify(probabilities, null, 2));
    it.each(randomModes)(`should return the correct result for numberOfRows ${numberOfRow}`, (mode) => {
        // Arrange
        const statistic: Record<number, number> = {};
        const percentage: Record<number, number> = {};
        // Act
        for (let i = 0; i < totalRuns; i++) {
            const { slotIndex } = run(mode, numberOfRow);
            statistic[slotIndex] = (statistic[slotIndex] || 0) + 1;
        }
        for (let slotIndex = 0; slotIndex <= numberOfRow; slotIndex++) {
            percentage[slotIndex] = (statistic[slotIndex] / totalRuns) * 100 || 0;
        }
        console.log(`mode: ${mode}, numberOfRows: ${numberOfRow}`);
        console.log(JSON.stringify(percentage, null, 2));
        for (let slotIndex = 0; slotIndex <= numberOfRow; slotIndex++) {
            expect(Math.abs(percentage[slotIndex] - probabilities[slotIndex])).toBeLessThanOrEqual(1);
        }
    });
});
