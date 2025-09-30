import RoundResultConsumer from "../../../src/consumers/round-result-consumer";

// Mock the base class
const mockGenerateServerSeed = jest.fn();

jest.mock("sc-game-base/src/core/event-consumers", () => ({
    RoundResultConsumer: class {
        generateServerSeed = mockGenerateServerSeed;
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
        getSHA256Hash: jest.fn(),
        getSHA512Hash: jest.fn(),
        getMergeClientSeed: jest.fn(),
    },
}));

describe("RoundResultConsumer", () => {
    let roundResultConsumer: RoundResultConsumer;
    let mockGameData: any;
    let mockResultsRepository: any;
    let mockDefinition: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mocks
        mockGameData = {
            settlementResultFromAdmin: {},
        };

        mockResultsRepository = {
            create: jest.fn(),
        };

        mockDefinition = {
            generateResult: jest.fn(),
        };

        // Create instance
        // @ts-ignore
        roundResultConsumer = new RoundResultConsumer();
        roundResultConsumer.gameData = mockGameData;
        roundResultConsumer.resultsRepository = mockResultsRepository;
        roundResultConsumer.definition = mockDefinition;
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
            mockGenerateServerSeed.mockReturnValue("serverSeed");
            const mockSeedHelper = require("sc-game-base/src/core/helpers").SeedHelper;
            mockSeedHelper.getSHA256Hash.mockReturnValue("serverSeedHash");
            mockSeedHelper.getSHA512Hash.mockReturnValue("finalHash");
            mockSeedHelper.getMergeClientSeed.mockReturnValue("mergedSeed");
            mockDefinition.generateResult.mockReturnValue([1, 0, 1, 0]);
        });

        it("should return admin result when available", async () => {
            // Arrange
            const playerName = "testPlayer";
            const roundId = 123;
            const adminResult = { playerName, result: [1, 1, 1, 1] };
            mockGameData.settlementResultFromAdmin = {
                playerName,
                result: adminResult,
            };
            roundResultConsumer.createResultDocument = jest.fn();

            // Act
            const result = await roundResultConsumer.generateResultByBet(playerName, roundId);

            // Assert
            expect(result).toEqual(adminResult.result);
            expect(mockDefinition.generateResult).not.toHaveBeenCalled();
            expect(roundResultConsumer.createResultDocument).not.toHaveBeenCalled();
        });

        it("should generate new result when no admin result", async () => {
            // Arrange
            const playerName = "testPlayer";
            const roundId = 123;
            const expectedResult = [1, 0, 1, 0, 0, 0, 0, 1];
            mockGameData.ingame = {
                [playerName]: {
                    clientSeed: "1234",
                },
            };
            mockDefinition.generateResult.mockReturnValue(expectedResult);

            // Act
            const result = await roundResultConsumer.generateResultByBet(playerName, roundId);

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
    });

    describe("generateResultData", () => {
        beforeEach(() => {
            mockGenerateServerSeed.mockReturnValue("serverSeed");
            const mockSeedHelper = require("sc-game-base/src/core/helpers").SeedHelper;
            mockSeedHelper.getSHA256Hash.mockReturnValue("serverSeedHash");
            mockSeedHelper.getSHA512Hash.mockReturnValue("finalHash");
            mockSeedHelper.getMergeClientSeed.mockReturnValue("mergedSeed");
        });

        it("should generate complete result data structure", () => {
            // Arrange
            const playerName = "testPlayer";
            mockGameData.ingame = {
                [playerName]: {
                    clientSeed: "1234",
                },
            };

            // Act
            const result = roundResultConsumer.generateResultData(playerName);

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
    });
});
