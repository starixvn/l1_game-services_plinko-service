import RoundResultConsumer from "../../../src/consumers/round-result-consumer";
import { SeedHelper } from "sc-game-base/src/core/helpers";
import { generateServerSeedAndHash } from "../../../src/helpers/pf-helper";
import { GAME_MODE, NUMBER_OF_ROWS } from "../../../src/constants";
import { SettlementResult } from "../../../src/types";

// Mock the base class
jest.mock("sc-game-base/src/core/event-consumers", () => ({
    RoundResultConsumer: class {
        constructor() {
            return this;
        }
    },
}));
// Mock Date
const mockDate = new Date("2024-01-01T00:00:00Z");
jest.spyOn(global, "Date").mockImplementation(() => mockDate);

// Mock SeedHelper
jest.mock("sc-game-base/src/core/helpers", () => ({
    SeedHelper: {
        getSHA512Hash: jest.fn(),
        getMergeClientSeed: jest.fn(),
    },
}));

// Mock PF-Helper
jest.mock("../../../src/helpers/pf-helper", () => {
    return {
        generateServerSeedAndHash: jest.fn().mockReturnValue({ serverSeedHash: "serverSeedHash", serverSeed: "serverSeed" }),
    };
});

// Mock LightningBoardAssigner
const mockAssignBoard = jest.fn();
jest.mock("../../../src/lightning-feature/lightning-board-assigner", () => ({
    LightningBoardAssigner: class {
        assignBoard = mockAssignBoard;
        constructor() {
            return this;
        }
    },
}));

describe("RoundResultConsumer", () => {
    let roundResultConsumer: RoundResultConsumer;
    let mockGameData: any;
    let mockResultsRepository: any;
    let mockDefinition: any;
    let mockLightningBoardAssigner: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mocks
        mockGameData = {
            settlementResultFromAdmin: {},
            playerPf: {},
            ingame: {},
            gameConfigs: {
                randomMode: 1,
                plinkoConfig: {
                    odds: {
                        0: {
                            8: [1, 2, 2.5, 4, 5, 6, 7, 8, 9],
                            12: [1, 2, 2.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
                            16: [5000, 2, 2.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
                        },
                        1: {
                            8: [1, 2, 2.5, 4, 5, 6, 7, 8, 9],
                            12: [1, 2, 2.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
                            16: [5000, 2, 2.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
                        },
                    },
                },
            },
        };

        mockResultsRepository = {
            create: jest.fn(),
        };

        mockDefinition = {
            generateResult: jest.fn(),
            settle: jest.fn(),
        };

        // Create LightningBoardAssigner mock
        const { LightningBoardAssigner } = require("../../../src/lightning-feature/lightning-board-assigner");
        mockLightningBoardAssigner = new LightningBoardAssigner();

        // Create instance
        // @ts-ignore
        roundResultConsumer = new RoundResultConsumer();
        roundResultConsumer.gameData = mockGameData;
        roundResultConsumer.resultsRepository = mockResultsRepository;
        roundResultConsumer.definition = mockDefinition;
        roundResultConsumer.lightningBoardAssigner = mockLightningBoardAssigner;
    });

    describe("getResultFromAdmin", () => {
        it("should return admin result when player name matches", () => {
            // Arrange
            const playerName = "testPlayer";
            const expectedResult = { playerName: playerName, result: [1, 0, 1, 0] };
            mockGameData.settlementResultFromAdmin = {
                playerName,
                result: expectedResult,
            };

            // Act
            const result = roundResultConsumer.getResultFromAdmin(playerName);

            // Assert
            expect(result).toEqual(expectedResult.result);
            expect(mockGameData.settlementResultFromAdmin).toEqual({});
        });

        it("should return null when player name does not match", () => {
            // Arrange
            const playerName = "testPlayer";
            mockGameData.settlementResultFromAdmin = {
                playerName: "differentPlayer",
                result: { playerName: "differentPlayer", result: [1, 0, 1, 0] },
            };

            // Act
            const result = roundResultConsumer.getResultFromAdmin(playerName);

            // Assert
            expect(result).toBeNull();
            expect(mockGameData.settlementResultFromAdmin).toEqual({
                playerName: "differentPlayer",
                result: { playerName: "differentPlayer", result: [1, 0, 1, 0] },
            });
        });

        it("should return null when no admin result is set", () => {
            // Arrange
            const playerName = "testPlayer";
            mockGameData.settlementResultFromAdmin = {};

            // Act
            const result = roundResultConsumer.getResultFromAdmin(playerName);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe("generateResultByBet", () => {
        beforeEach(() => {
            (SeedHelper.getSHA512Hash as jest.Mock).mockReturnValue("finalHash");
            (SeedHelper.getMergeClientSeed as jest.Mock).mockReturnValue("mergedSeed");
            mockDefinition.generateResult.mockReturnValue([1, 0, 1, 0]);
        });

        it("should return admin result when available", async () => {
            // Arrange
            const playerName = "testPlayer";
            const roundId = 123;
            const payload = {
                amount: 100,
                numberOfRows: 12,
                gameMode: 1,
                clientSeed: "test-seed",
            };
            const adminResult = { playerName, result: [1, 1, 1, 1] };
            mockGameData.settlementResultFromAdmin = {
                playerName,
                result: adminResult,
            };
            roundResultConsumer.createResultDocument = jest.fn();

            // Act
            const result = await roundResultConsumer.generateResultByBet(playerName, roundId, payload);

            // Assert
            expect(result).toEqual(adminResult.result);
            expect(mockDefinition.generateResult).not.toHaveBeenCalled();
            expect(roundResultConsumer.createResultDocument).not.toHaveBeenCalled();
        });

        it("should generate new result when no admin result and amount is greater than 0", async () => {
            // Arrange
            const playerName = "testPlayer";
            const roundId = 123;
            const payload = {
                amount: 100,
                numberOfRows: 12,
                gameMode: 1,
                clientSeed: "test-seed",
            };
            const expectedResult = [1, 0, 1, 0, 0, 0, 0, 1];
            mockGameData.ingame = {
                [playerName]: {
                    clientSeed: "1234",
                },
            };
            mockDefinition.generateResult.mockReturnValue(expectedResult);

            // Act
            const result = await roundResultConsumer.generateResultByBet(playerName, roundId, payload);

            // Assert
            expect(result).toEqual(expectedResult);
            expect(mockResultsRepository.create).toHaveBeenCalledWith({
                roundId: roundId,
                serverSeedHash: "serverSeedHash",
                serverSeed: "serverSeed",
                clientSeeds: [{ name: playerName, clientSeed: "1234" }],
                mergeClientSeed: "mergedSeed",
                mergeSeed: "serverSeedmergedSeed",
                finalHash: "finalHash",
                time: mockDate,
            });
            expect(mockDefinition.generateResult).toHaveBeenCalledWith("finalHash");
        });

        it("should generate result without creating document when amount is 0 (trial mode)", async () => {
            // Arrange
            const playerName = "testPlayer";
            const roundId = 123;
            const payload = {
                amount: 0,
                numberOfRows: 12,
                gameMode: 1,
                clientSeed: "test-seed",
            };
            const expectedResult = [1, 0, 1, 0];
            (SeedHelper.getSHA512Hash as jest.Mock).mockReturnValue("trialHash");
            mockDefinition.generateResult.mockReturnValue(expectedResult);

            // Act
            const result = await roundResultConsumer.generateResultByBet(playerName, roundId, payload);

            // Assert
            expect(result).toEqual(expectedResult);
            expect(mockResultsRepository.create).not.toHaveBeenCalled();
            expect(mockDefinition.generateResult).toHaveBeenCalledWith("trialHash");
            expect(generateServerSeedAndHash).toHaveBeenCalledWith(1);
        });
    });

    describe("generateResultData", () => {
        beforeEach(() => {
            (SeedHelper.getSHA512Hash as jest.Mock).mockReturnValue("finalHash");
            (SeedHelper.getMergeClientSeed as jest.Mock).mockReturnValue("mergedSeed");
        });

        it("should generate complete result data structure when not in trial mode", () => {
            // Arrange
            const playerName = "testPlayer";
            mockGameData.ingame = { [playerName]: { clientSeed: "1234" } };
            mockGameData.playerPf = {
                [playerName]: {
                    serverSeedHash: "playerServerSeedHash",
                    serverSeed: "playerServerSeed",
                },
            };

            // Act
            const result = roundResultConsumer.generateResultData(playerName, false);

            // Assert
            expect(result).toEqual({
                serverSeedHash: "playerServerSeedHash",
                serverSeed: "playerServerSeed",
                clientSeeds: [{ name: playerName, clientSeed: "1234" }],
                mergeClientSeed: "mergedSeed",
                mergeSeed: "playerServerSeedmergedSeed",
                finalHash: "finalHash",
            });
        });

        it("should generate result data with default server seed when player pf is not set", () => {
            // Arrange
            const playerName = "testPlayer";
            mockGameData.ingame = {
                [playerName]: { clientSeed: "1234" },
            };

            // Act
            const result = roundResultConsumer.generateResultData(playerName, false);

            // Assert
            expect(result).toEqual({
                serverSeedHash: "serverSeedHash",
                serverSeed: "serverSeed",
                clientSeeds: [{ name: playerName, clientSeed: "1234" }],
                mergeClientSeed: "mergedSeed",
                mergeSeed: "serverSeedmergedSeed",
                finalHash: "finalHash",
            });
        });

        it("should generate result data with empty server seed when player pf is empty", () => {
            // Arrange
            const playerName = "testPlayer";
            mockGameData.ingame = {
                [playerName]: { clientSeed: "1234" },
            };
            mockGameData.playerPf = { [playerName]: {} };

            // Act
            const result = roundResultConsumer.generateResultData(playerName, false);

            // Assert
            expect(result).toEqual({
                serverSeedHash: "",
                serverSeed: "",
                clientSeeds: [{ name: playerName, clientSeed: "1234" }],
                mergeClientSeed: "mergedSeed",
                mergeSeed: "undefinedmergedSeed",
                finalHash: "finalHash",
            });
        });

        it("should generate trial mode result data when isTrialMode is true", () => {
            // Arrange
            const playerName = "testPlayer";
            (SeedHelper.getSHA512Hash as jest.Mock).mockReturnValue("trialHash");

            // Act
            const result = roundResultConsumer.generateResultData(playerName, true);

            // Assert
            expect(generateServerSeedAndHash).toHaveBeenCalledWith(1);
            expect(SeedHelper.getSHA512Hash).toHaveBeenCalledWith("serverSeed");
            expect(result).toEqual({
                serverSeedHash: "",
                serverSeed: "serverSeed",
                clientSeeds: [],
                mergeClientSeed: "",
                mergeSeed: "serverSeed",
                finalHash: "trialHash",
            });
        });
    });

    describe("createResultDocument", () => {
        it("should create result document with correct structure", async () => {
            // Arrange
            const roundId = 123;
            const resultData = {
                serverSeedHash: "serverSeedHash",
                serverSeed: "serverSeed",
                clientSeeds: [{ name: "testPlayer", clientSeed: "1234" }],
                mergeClientSeed: "mergedSeed",
                mergeSeed: "serverSeedmergedSeed",
                finalHash: "finalHash",
            };

            // Act
            await roundResultConsumer.createResultDocument(resultData, roundId);

            // Assert
            expect(mockResultsRepository.create).toHaveBeenCalledWith({
                roundId,
                serverSeedHash: "serverSeedHash",
                serverSeed: "serverSeed",
                clientSeeds: [{ name: "testPlayer", clientSeed: "1234" }],
                mergeClientSeed: "mergedSeed",
                mergeSeed: "serverSeedmergedSeed",
                finalHash: "finalHash",
                time: mockDate,
            });
        });
    });

    describe("generateRoundData", () => {
        beforeEach(() => {
            (SeedHelper.getSHA512Hash as jest.Mock).mockReturnValue("finalHash");
            (SeedHelper.getMergeClientSeed as jest.Mock).mockReturnValue("mergedSeed");
            mockDefinition.generateResult.mockReturnValue([1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1]);
        });

        it("should generate round data for normal mode without lightning board", async () => {
            // Arrange
            const playerName = "testPlayer";
            const roundId = 123;
            const payload = {
                amount: 100,
                numberOfRows: 12,
                gameMode: 1,
                clientSeed: "test-seed",
            };
            const mockResult = [1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1];
            const expectedSettlementResult: SettlementResult = {
                slotIndex: 5,
                multiplier: 6,
            };
            mockGameData.ingame = {
                [playerName]: {
                    clientSeed: "1234",
                },
            };
            mockDefinition.generateResult.mockReturnValue([1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1]);
            mockDefinition.settle.mockReturnValue(expectedSettlementResult);
            mockResultsRepository.create.mockResolvedValue({});

            // Act
            const result = await roundResultConsumer.generateRoundData(playerName, roundId, payload);

            // Assert
            expect(result.result).toEqual(mockResult);
            expect(result.result.length).toBe(12);
            expect(mockDefinition.settle).toHaveBeenCalledWith(mockResult, mockGameData.gameConfigs.plinkoConfig.odds[1][12], undefined);
            expect(result.settlementResult).toEqual(expectedSettlementResult);
            expect(result.odds).toEqual({
                ...mockGameData.gameConfigs.plinkoConfig.odds,
                [GAME_MODE.LIGHTNING]: { [NUMBER_OF_ROWS.lightning]: [] },
            });
            expect(result.board).toBeNull();
            expect(mockAssignBoard).not.toHaveBeenCalled();
        });

        it("should generate round data for lightning mode with board assignment", async () => {
            // Arrange
            const playerName = "testPlayer";
            const roundId = 123;
            const payload = {
                amount: 100,
                numberOfRows: 16,
                gameMode: 3,
                clientSeed: "test-seed",
                isLightningMode: true,
                lightningKey: "lightning-key-123",
            };
            const mockBoard = {
                odds: [10, 20, 30, 40, 50],
                pegMultipliers: [
                    { row: 0, column: 0, multiplier: 1.5 },
                    { row: 1, column: 1, multiplier: 2.0 },
                ],
            };
            const mockResult = [1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1];
            const expectedSettlementResult: SettlementResult = {
                slotIndex: 3,
                multiplier: 40,
            };
            mockGameData.ingame = {
                [playerName]: {
                    clientSeed: "1234",
                },
            };
            mockDefinition.generateResult.mockReturnValue([1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1]);
            mockDefinition.settle.mockReturnValue(expectedSettlementResult);
            mockAssignBoard.mockReturnValue({ board: mockBoard });

            // Act
            const result = await roundResultConsumer.generateRoundData(playerName, roundId, payload);

            // Assert
            expect(result.result).toEqual(mockResult);
            expect(mockAssignBoard).toHaveBeenCalledWith(playerName, "lightning-key-123");
            expect(mockDefinition.settle).toHaveBeenCalledWith(mockResult, mockBoard.odds, mockBoard.pegMultipliers);
            expect(result.settlementResult).toEqual(expectedSettlementResult);
            expect(result.odds).toEqual({
                ...mockGameData.gameConfigs.plinkoConfig.odds,
                [GAME_MODE.LIGHTNING]: { [NUMBER_OF_ROWS.lightning]: mockBoard.odds },
            });
            expect(result.board).toEqual(mockBoard);
        });

        it("should handle lightning mode when board is undefined", async () => {
            // Arrange
            const playerName = "testPlayer";
            const roundId = 123;
            const payload = {
                amount: 100,
                numberOfRows: 16,
                gameMode: 3,
                clientSeed: "test-seed",
                isLightningMode: true,
                lightningKey: "lightning-key-123",
            };
            const mockResult = [1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1];
            const expectedSettlementResult: SettlementResult = {
                slotIndex: 0,
                multiplier: 10,
            };
            mockGameData.ingame = {
                [playerName]: {
                    clientSeed: "1234",
                },
            };
            mockDefinition.generateResult.mockReturnValue([1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1]);
            mockDefinition.settle.mockReturnValue(expectedSettlementResult);
            mockAssignBoard.mockReturnValue({ board: undefined });

            // Act
            const result = await roundResultConsumer.generateRoundData(playerName, roundId, payload);

            // Assert
            expect(mockAssignBoard).toHaveBeenCalledWith(playerName, "lightning-key-123");
            expect(mockDefinition.settle).toHaveBeenCalledWith(mockResult, [], undefined);
            expect(result.odds[GAME_MODE.LIGHTNING][NUMBER_OF_ROWS.lightning]).toEqual([]);
            expect(result.board).toBeUndefined();
        });

        it("should slice result to match numberOfRows", async () => {
            // Arrange
            const playerName = "testPlayer";
            const roundId = 123;
            const payload = {
                amount: 100,
                numberOfRows: 8,
                gameMode: 1,
                clientSeed: "test-seed",
            };
            const fullResult = [1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1]; // 16 elements
            const expectedSlicedResult = [1, 0, 1, 0, 1, 1, 0, 0]; // First 8 elements
            mockGameData.ingame = {
                [playerName]: {
                    clientSeed: "1234",
                },
            };
            mockDefinition.generateResult.mockReturnValue(fullResult);
            mockDefinition.settle.mockReturnValue({ slotIndex: 2, multiplier: 2.5 });

            // Act
            const result = await roundResultConsumer.generateRoundData(playerName, roundId, payload);

            // Assert
            expect(result.result).toEqual(expectedSlicedResult);
            expect(result.result.length).toBe(8);
        });
    });
});
