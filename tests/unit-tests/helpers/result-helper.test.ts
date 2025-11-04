import { generateResult, getSettlementResult } from "../../../src/helpers/result-helper";

// Mock the constants module
jest.mock("../../../src/constants", () => ({
    NUMBER_OF_ROWS: {
        min: 8,
        max: 16,
    },
}));

describe("Result Helper", () => {
    describe("generateResult", () => {
        it("should convert SHA512 hash to binary array with correct length", () => {
            // Arrange
            const sha512Hash = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"; // 64 chars

            // Act
            const result = generateResult(sha512Hash);

            // Assert
            expect(result).toHaveLength(16);
            expect(result.every((num) => num === 0 || num === 1)).toBe(true);
        });

        it("should correctly convert hex values to binary", () => {
            // Arrange - Create a hash where we know the expected binary conversion
            // "00" should become 0 (even), "01" should become 1 (odd)
            const hash = "00" + "01".repeat(31); // 32 bytes = 64 chars

            // Act
            const result = generateResult(hash);

            // Assert
            expect(result[0]).toBe(0); // "00" -> 0 (even)
            expect(result[1]).toBe(1); // "01" -> 1 (odd)
        });
    });

    describe("getSettlementResult", () => {
        it("should count the number of 1s in the result array", () => {
            // Arrange
            const resultArray = [0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1]; // 9 ones

            // Act
            const { slotIndex } = getSettlementResult(resultArray);

            // Assert
            expect(slotIndex).toBe(9);
        });

        it("should return 0 when no 1s are present", () => {
            // Arrange
            const resultArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

            // Act
            const { slotIndex } = getSettlementResult(resultArray);

            // Assert
            expect(slotIndex).toBe(0);
        });

        it("should return maximum count when all are 1s", () => {
            // Arrange
            const resultArray = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

            // Act
            const { slotIndex } = getSettlementResult(resultArray);

            // Assert
            expect(slotIndex).toBe(16);
        });

        it("should handle empty array", () => {
            // Arrange
            const resultArray: number[] = [];

            // Act
            const { slotIndex } = getSettlementResult(resultArray);

            // Assert
            expect(slotIndex).toBe(0);
        });

        it("should return the correct slot index and multiplier when has peg multipliers", () => {
            // Arrange
            const resultArray = [0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1];
            const odds = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 13, 13: 14, 14: 15, 15: 16 };
            const pegMultipliers = [{ row: 5, column: 3, multiplier: 5 }];

            // Act
            const { slotIndex, multiplier } = getSettlementResult(resultArray, odds, pegMultipliers);

            // Assert
            expect(slotIndex).toBe(9);
            expect(multiplier).toBe(50); // odds[9] * extraMultiplier;
        });

        it("should return the correct slot index and multiplier when no peg multipliers", () => {
            // Arrange
            const resultArray = [0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1];
            const odds = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 13, 13: 14, 14: 15, 15: 16 };

            // Act
            const { slotIndex, multiplier } = getSettlementResult(resultArray, odds);

            // Assert
            expect(slotIndex).toBe(9);
            expect(multiplier).toBe(10);
        });
    });
});
