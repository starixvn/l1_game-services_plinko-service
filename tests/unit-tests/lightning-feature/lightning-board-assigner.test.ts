import { LightningBoardAssigner } from "../../../src/lightning-feature/lightning-board-assigner";
import * as fs from "fs";
import * as path from "path";
import Chance from "chance";
import { generateRandomString } from "../../../src/helpers/string-helper";

jest.mock("fs");
jest.mock("chance");
jest.mock("path");

jest.mock("../../../src/helpers/string-helper", () => ({
    isValidLightningKey: jest.fn().mockReturnValue(true),
    generateRandomString: jest.fn(),
}));
jest.spyOn(process, "cwd").mockReturnValue("/test/project");

describe("LightningBoardAssigner", () => {
    let assigner: LightningBoardAssigner;
    let mockChance: jest.Mocked<Chance.Chance>;
    let mockReadFileSync: jest.MockedFunction<typeof fs.readFileSync>;
    let logService: any;

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock process.cwd() to return a test directory

        // Mock path.resolve for getBoardFromFile calls
        jest.spyOn(path, "resolve").mockImplementation((...args: string[]) => {
            return args.join("/").replace(/\/+/g, "/");
        });
        mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;

        // Mock Chance instance
        mockChance = {
            integer: jest.fn(),
            string: jest.fn(),
        } as any;

        (Chance as unknown as jest.Mock).mockImplementation(() => mockChance);

        logService = {
            logError: jest.fn(),
        };
        assigner = new LightningBoardAssigner({ logService });
    });

    describe("getPlayerKey", () => {
        it("should generate new key for player that does not exist", () => {
            // Arrange
            mockChance.integer.mockReturnValue(8);
            (generateRandomString as jest.Mock).mockReturnValue("abc123xy");

            // Act
            const key = assigner.getPlayerKey("newPlayer");

            // Assert
            expect(mockChance.integer).toHaveBeenCalledWith({ min: 4, max: 8 });
            expect(generateRandomString).toHaveBeenCalledWith(8);
            expect(assigner["playerToKey"].has("newPlayer")).toBe(true);
            expect(key).toBe("abc123xy");
        });
    });

    describe("getBoardIndexFromKey", () => {
        it("should return deterministic index for same key", () => {
            // Arrange
            const key = "testKey123";

            // Act
            const index1 = assigner.getBoardIndexFromKey(key);
            const index2 = assigner.getBoardIndexFromKey(key);

            // Assert
            expect(index1).toBe(index2);
        });

        it("should return different indices for different keys", () => {
            // Arrange & Act
            const index1 = assigner.getBoardIndexFromKey("key1");
            const index2 = assigner.getBoardIndexFromKey("key2");

            // Assert
            expect(index1).not.toBe(index2);
        });

        it("should return index within valid range", () => {
            // Arrange
            const key = "someRandomKey";

            // Act
            const index = assigner.getBoardIndexFromKey(key);

            // Assert
            expect(index).toBeGreaterThanOrEqual(0);
            expect(index).toBeLessThan(99_900);
        });

        it("should handle long key string", () => {
            // Arrange
            const longKey = "a".repeat(100);

            // Act
            const index = assigner.getBoardIndexFromKey(longKey);

            // Assert
            expect(index).toBeGreaterThanOrEqual(0);
            expect(index).toBeLessThan(99_900);
        });
    });

    describe("getBoardFromFile", () => {
        const mockBoard1 = {
            odds: [1.0, 2.0, 3.0],
            pegMultipliers: [],
        };
        const mockBoard2 = {
            odds: [1.5, 2.5, 3.5],
            pegMultipliers: [{ row: 1, column: 1, multiplier: 2.0 }],
        };

        it("should read board from file when not cached using resolved path", () => {
            // Arrange
            const batchData = [mockBoard1, mockBoard2];
            mockReadFileSync.mockReturnValue(JSON.stringify(batchData));
            const expectedPath = "/test/project/lightning-data/batches/1.json";
            (path.resolve as jest.Mock).mockReturnValueOnce(expectedPath);

            // Act
            const board = assigner.getBoardFromFile(0);

            // Assert
            expect(path.resolve).toHaveBeenCalledWith(process.cwd(), "lightning-data", "batches", "1.json");
            expect(mockReadFileSync).toHaveBeenCalledWith(expectedPath, "utf-8");
            expect(board).toEqual(mockBoard1);
        });

        it("should return board from cache when already loaded", () => {
            // Arrange
            const batchData = [mockBoard1, mockBoard2];
            assigner["batchCache"].set(0, batchData);

            // Act
            const board = assigner.getBoardFromFile(1);

            // Assert
            expect(mockReadFileSync).not.toHaveBeenCalled();
            expect(board).toEqual(mockBoard2);
        });

        it("should calculate correct batch file number", () => {
            // Arrange
            mockReadFileSync.mockReturnValue(JSON.stringify([mockBoard1]));
            const expectedPath = "/test/project/lightning-data/batches/2.json";
            (path.resolve as jest.Mock).mockReturnValueOnce(expectedPath);

            // Act
            assigner.getBoardFromFile(500); // Second batch (501st board)

            // Assert
            expect(path.resolve).toHaveBeenCalledWith(process.cwd(), "lightning-data", "batches", "2.json");
            expect(mockReadFileSync).toHaveBeenCalledWith(expectedPath, "utf-8");
        });

        it("should return null when file read fails", () => {
            // Arrange
            const expectedPath = "/test/project/lightning-data/batches/1.json";
            (path.resolve as jest.Mock).mockReturnValueOnce(expectedPath);
            mockReadFileSync.mockImplementation(() => {
                throw new Error("File not found");
            });

            // Act
            const board = assigner.getBoardFromFile(0);

            // Assert
            expect(board).toBeNull();
            expect(logService.logError).toHaveBeenCalledWith(expect.stringContaining("1.json: Error: File not found"));
        });

        it("should return null when board index does not exist in batch", () => {
            // Arrange
            const batchData = [mockBoard1]; // Only one board
            const expectedPath = "/test/project/lightning-data/batches/1.json";
            (path.resolve as jest.Mock).mockReturnValueOnce(expectedPath);
            mockReadFileSync.mockReturnValue(JSON.stringify(batchData));

            // Act
            const board = assigner.getBoardFromFile(499); // Last board of batch 1

            // Assert
            expect(board).toBeNull();
        });

        it("should cache multiple batches independently", () => {
            // Arrange
            const batch1Data = [mockBoard1];
            const batch2Data = [mockBoard2];
            const expectedPath1 = "/test/project/lightning-data/batches/1.json";
            const expectedPath2 = "/test/project/lightning-data/batches/2.json";

            (path.resolve as jest.Mock).mockReturnValueOnce(expectedPath1).mockReturnValueOnce(expectedPath2);
            mockReadFileSync.mockReturnValueOnce(JSON.stringify(batch1Data)).mockReturnValueOnce(JSON.stringify(batch2Data));

            // Act
            const board1 = assigner.getBoardFromFile(0); // Batch 1
            const board2 = assigner.getBoardFromFile(500); // Batch 2
            const board1Again = assigner.getBoardFromFile(0); // Batch 1 from cache

            // Assert
            expect(mockReadFileSync).toHaveBeenCalledTimes(2);
            expect(board1).toEqual(mockBoard1);
            expect(board2).toEqual(mockBoard2);
            expect(board1Again).toEqual(mockBoard1);
        });
    });

    describe("getBoardFromIndex", () => {
        const mockBoard = {
            odds: [1.0, 2.0, 3.0],
            pegMultipliers: [],
        };

        it("should return board when found at given index", () => {
            // Arrange
            assigner["batchCache"].set(0, [mockBoard]);

            // Act
            const board = assigner.getBoardFromIndex(0);

            // Assert
            expect(board).toEqual(mockBoard);
            expect(mockReadFileSync).not.toHaveBeenCalled();
        });

        it("should handle multiple null boards before finding valid one", () => {
            // Arrange
            const validBoard = { odds: [5.0], pegMultipliers: [] };
            const batch = [null, null, null, validBoard];
            const expectedPath = "/test/project/src/lightning-feature/batches/1.json";
            (path.resolve as jest.Mock).mockReturnValue(expectedPath);
            mockReadFileSync.mockReturnValue(JSON.stringify(batch));

            // Act
            const board = assigner.getBoardFromIndex(0);

            // Assert
            expect(board).toEqual(validBoard);
            // All indices 0-3 are in the same batch (batch 0), so file is read once and cached
            // getBoardFromIndex tries: index 0 -> null, index 1 -> null, index 2 -> null, index 3 -> validBoard
            // But since they're all in the same batch file, readFileSync is only called once
            expect(mockReadFileSync).toHaveBeenCalledTimes(1);
        });

        it("should stop retrying after 10 attempts", () => {
            // Arrange
            const expectedPath = "/test/project/src/lightning-feature/batches/1.json";
            (path.resolve as jest.Mock).mockReturnValue(expectedPath);
            // Mock to return array with nulls (all boards in batch are null)
            // BATCH_SIZE is 500, so we need an array with 500 nulls
            const batchWithNulls = new Array(500).fill(null);
            mockReadFileSync.mockReturnValue(JSON.stringify(batchWithNulls));

            // Act
            const board = assigner.getBoardFromIndex(0);

            // Assert
            expect(board).toBeNull();
            // All indices 0-9 are in the same batch (batch 0), so file is read once and cached
            // getBoardFromIndex tries indices 0-9 recursively, but readFileSync is only called once
            // when the batch is first accessed (index 0), then the cache is used for indices 1-9
            expect(mockReadFileSync).toHaveBeenCalledTimes(1);
            // Verify it tried 10 different indices by checking the cache was accessed
            expect(assigner["batchCache"].has(0)).toBe(true);
        });

        it("should retry with next index when board is null across different batches", () => {
            // Arrange
            const validBoard = { odds: [3.0], pegMultipliers: [] };
            // Create batch 0 with all nulls, and batch 1 with valid board at index 0
            const batch0 = new Array(500).fill(null); // Batch 0 has 500 nulls
            const batch1 = [validBoard]; // Batch 1 has valid board at index 0
            const expectedPath1 = "/test/project/src/lightning-feature/batches/1.json";
            const expectedPath2 = "/test/project/src/lightning-feature/batches/2.json";

            (path.resolve as jest.Mock).mockReturnValueOnce(expectedPath1).mockReturnValueOnce(expectedPath2);
            mockReadFileSync.mockReturnValueOnce(JSON.stringify(batch0)).mockReturnValueOnce(JSON.stringify(batch1));

            // Act
            // Start at index 499 (last index of batch 0), which will be null
            // Then retry with index 500 (first index of batch 1), which will have valid board
            const board = assigner.getBoardFromIndex(499);

            // Assert
            expect(board).toEqual(validBoard);
            // Should have tried index 499 (batch 0, null), then recursively tried index 500 (batch 1, validBoard)
            expect(mockReadFileSync).toHaveBeenCalledTimes(2);
        });
    });

    describe("assignBoard", () => {
        const mockBoard = {
            odds: [1.0, 2.0, 3.0],
            pegMultipliers: [],
        };

        beforeEach(() => {
            // Mock path.resolve for getBoardFromFile calls
            const expectedPath = "/test/project/src/lightning-feature/batches/1.json";
            (path.resolve as jest.Mock).mockReturnValue(expectedPath);
            mockReadFileSync.mockReturnValue(JSON.stringify([mockBoard]));
        });

        it("should use provided lightningKey when given", () => {
            // Arrange
            const providedKey = "customKey123";
            assigner.getBoardFromIndex = jest.fn().mockReturnValue(mockBoard);

            // Act
            const result = assigner.assignBoard("player1", providedKey);

            // Assert
            expect(result.key).toBe(providedKey);
            expect(result.board).toEqual(mockBoard);
        });

        it("should generate new key when lightningKey not provided", () => {
            // Arrange
            mockChance.integer.mockReturnValue(6);
            (generateRandomString as jest.Mock).mockReturnValue("generatedKey");

            // Act
            const result = assigner.assignBoard("player1");

            // Assert
            expect(result.key).toBe("generatedKey");
            expect(mockChance.integer).toHaveBeenCalled();
            expect(generateRandomString).toHaveBeenCalledWith(6);
        });

        it("should use getPlayerKey for existing player", () => {
            // Arrange
            assigner["playerToKey"].set("player1", "storedKey");

            // Act
            const result = assigner.assignBoard("player1");

            // Assert
            expect(result.key).toBe("storedKey");
            expect(mockChance.integer).not.toHaveBeenCalled();
            expect(mockChance.string).not.toHaveBeenCalled();
        });

        it("should set player key to playerToKey map", () => {
            // Arrange
            assigner["playerToKey"].set("player1", "storedKey");

            // Act
            const result = assigner.assignBoard("player1", "otherKey");

            // Assert
            expect(result.key).toBe("otherKey");
            expect(assigner["playerToKey"].get("player1")).toBe("otherKey");
        });
    });
});
