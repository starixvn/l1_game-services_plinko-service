import { GAME_MODE, NUMBER_OF_ROWS } from "../../../src/constants";
import RoundResultConsumer from "../../../src/consumers/round-result-consumer";
import SettleGameRoundConsumer from "../../../src/consumers/settle-game-round-consumer";
import { SettlementResult, PlinkoRound } from "../../../src/types";

// Mock the base class
const mockCallEndGame = jest.fn();

jest.mock("sc-game-base/src/core/event-consumers", () => ({
    SettleGameRoundConsumer: class {
        callEndGame = mockCallEndGame;
        constructor() {
            return this;
        }
    },
}));

// Mock Date
const mockDate = new Date("2024-01-01T00:00:00Z");
jest.spyOn(global, "Date").mockImplementation(() => mockDate);

// Mock RoundResultConsumer
const mockGenerateRoundData = jest.fn();

jest.mock("../../../src/consumers/round-result-consumer", () => {
    return class {
        generateRoundData = mockGenerateRoundData;
        constructor() {
            return this;
        }
    };
});

describe("SettleGameRoundConsumer", () => {
    let settleGameRoundConsumer: SettleGameRoundConsumer;
    let mockRoundResultConsumer: any;
    let mockGameData: any;
    let mockRoundsRepository: any;
    let mockDefinition: any;
    let mockPlayer: any;
    let mockPayload: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mocks
        mockPayload = {
            amount: 100,
            numberOfRows: 12,
            gameMode: 1,
            clientSeed: "test-seed",
        };
        mockGameData = {
            gameConfigs: {
                plinkoConfig: {
                    odds: {
                        1: {
                            8: [1, 2, 2.5, 4, 5, 6, 7, 8, 9],
                            12: [1, 2, 2.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
                            16: [5000, 2, 2.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
                        },
                    },
                },
                maxWinPerRound: 1,
            },
            currencyGroupGames: [{ groupId: "group1", maxBet: 1000 }],
            exchangeRates: {
                exId: 123,
                code: {
                    USD: 1,
                },
            },
        };

        mockRoundsRepository = {
            create: jest.fn(),
        };

        mockDefinition = {
            settle: jest.fn(),
        };

        mockPlayer = {
            UID: "player123",
            profile: {
                name: "testPlayer",
                maxBet: 1000,
            },
            session: {
                currencyName: "USD",
                currencyCode: "USD",
                siteId: "site1",
                siteName: "site1",
                playerId: "player1",
                operatorId: "op1",
                system: 10,
                currencyGroupId: "group1",
                multiplier: 1,
            },
        };

        // Create RoundResultConsumer mock
        // @ts-ignore
        mockRoundResultConsumer = new RoundResultConsumer();

        // Create instance
        // @ts-ignore
        settleGameRoundConsumer = new SettleGameRoundConsumer({
            roundResultConsumer: mockRoundResultConsumer,
        });
        settleGameRoundConsumer.roundResultConsumer = mockRoundResultConsumer;
        settleGameRoundConsumer.gameData = mockGameData;
        settleGameRoundConsumer.roundsRepository = mockRoundsRepository;
        settleGameRoundConsumer.definition = mockDefinition;
    });

    describe("settle", () => {
        it("should successfully settle a game round", async () => {
            // Arrange
            const roundId = 123;
            const mockResult = [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            const slotIndex = 2;
            const expectedSettlementResult: SettlementResult = {
                slotIndex,
                multiplier: 2.5,
            };
            const mockRoundData = {
                result: mockResult,
                settlementResult: expectedSettlementResult,
                odds: mockGameData.gameConfigs.plinkoConfig.odds,
                board: undefined,
            };
            const mockRound: PlinkoRound = {
                id: roundId,
                uid: mockPlayer.UID,
                name: mockPlayer.profile.name,
                amount: 100,
                totalAmount: 100,
                betWin: 250,
                reachMaxWin: false,
                paid: true,
                rate: 1,
                odds: mockGameData.gameConfigs.plinkoConfig.odds,
                time: mockDate,
                clientSeed: "test-seed",
                currency: "USD",
                siteId: "site1",
                siteName: "site1",
                playerId: "player1",
                operatorId: "op1",
                appType: 10,
                gameMode: 1,
                numberOfRows: 12,
                lightningKey: undefined,
                lightningBoard: undefined,
                result: mockResult,
                settlementResult: expectedSettlementResult,
                exchangeRateId: 123,
            };
            mockGenerateRoundData.mockResolvedValue(mockRoundData);
            settleGameRoundConsumer.createNewRoundDocument = jest.fn().mockResolvedValue(mockRound);
            settleGameRoundConsumer.settleBet = jest.fn();

            // Act
            const result = await settleGameRoundConsumer.settle(mockPlayer, roundId, mockPayload);

            // Assert
            expect(mockGenerateRoundData).toHaveBeenCalledWith("testPlayer", roundId, mockPayload);
            expect(settleGameRoundConsumer.createNewRoundDocument).toHaveBeenCalledWith(
                mockPlayer,
                {
                    roundId,
                    result: mockResult,
                    settlementResult: expectedSettlementResult,
                    odds: mockGameData.gameConfigs.plinkoConfig.odds,
                    board: undefined,
                },
                mockPayload
            );
            expect(settleGameRoundConsumer.settleBet).toHaveBeenCalledWith(mockRound);
            expect(result).toEqual({
                roundId,
                result: mockResult,
                settlementResult: expectedSettlementResult,
                winAmount: 250,
                amount: 100,
                reachMaxWin: false,
                time: mockDate,
                gameMode: 1,
                numberOfRows: 12,
                odds: mockGameData.gameConfigs.plinkoConfig.odds,
            });
        });

        it("should return null when round creation fails", async () => {
            // Arrange
            const roundId = 123;
            const mockResult = [1, 0, 0, 0, 0, 0, 0, 0, 0];
            const mockRoundData = {
                result: mockResult,
                settlementResult: { slotIndex: 2, multiplier: 2.5 },
                odds: mockGameData.gameConfigs.plinkoConfig.odds,
                board: undefined,
            };

            mockGenerateRoundData.mockResolvedValue(mockRoundData);
            settleGameRoundConsumer.createNewRoundDocument = jest.fn().mockResolvedValue(null);
            settleGameRoundConsumer.settleBet = jest.fn();

            // Act
            const result = await settleGameRoundConsumer.settle(mockPlayer, roundId, mockPayload);

            // Assert
            expect(mockGenerateRoundData).toHaveBeenCalledWith("testPlayer", roundId, mockPayload);
            expect(settleGameRoundConsumer.createNewRoundDocument).toHaveBeenCalled();
            expect(result).toBeNull();
            expect(settleGameRoundConsumer.settleBet).not.toHaveBeenCalled();
        });

        it("should successfully settle a game round with lightning board", async () => {
            // Arrange
            const roundId = 123;
            const mockResult = [1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1];
            const expectedSettlementResult: SettlementResult = {
                slotIndex: 3,
                multiplier: 40,
            };
            const mockBoard = {
                odds: [10, 20, 30, 40, 50],
                pegMultipliers: [
                    { row: 0, column: 0, multiplier: 1.5 },
                    { row: 1, column: 1, multiplier: 2.0 },
                ],
            };
            const lightningPayload = {
                ...mockPayload,
                isLightningMode: true,
                lightningKey: "lightning-key-123",
                gameMode: 3,
                numberOfRows: 16,
            };
            const mockRoundData = {
                result: mockResult,
                settlementResult: expectedSettlementResult,
                odds: {
                    ...mockGameData.gameConfigs.plinkoConfig.odds,
                    [GAME_MODE.LIGHTNING]: { [NUMBER_OF_ROWS.lightning]: mockBoard.odds },
                },
                board: mockBoard,
            };
            const mockRound: PlinkoRound = {
                id: roundId,
                uid: mockPlayer.UID,
                name: mockPlayer.profile.name,
                amount: 100,
                totalAmount: 100,
                betWin: 4000,
                reachMaxWin: false,
                paid: true,
                rate: 1,
                odds: mockRoundData.odds,
                time: mockDate,
                clientSeed: "test-seed",
                currency: "USD",
                siteId: "site1",
                siteName: "site1",
                playerId: "player1",
                operatorId: "op1",
                appType: 10,
                gameMode: 3,
                numberOfRows: 16,
                lightningKey: "lightning-key-123",
                lightningBoard: mockBoard,
                result: mockResult,
                settlementResult: expectedSettlementResult,
                exchangeRateId: 123,
            };
            mockGenerateRoundData.mockResolvedValue(mockRoundData);
            settleGameRoundConsumer.createNewRoundDocument = jest.fn().mockResolvedValue(mockRound);
            settleGameRoundConsumer.settleBet = jest.fn();

            // Act
            const result = await settleGameRoundConsumer.settle(mockPlayer, roundId, lightningPayload);

            // Assert
            expect(mockGenerateRoundData).toHaveBeenCalledWith("testPlayer", roundId, lightningPayload);
            expect(settleGameRoundConsumer.createNewRoundDocument).toHaveBeenCalledWith(
                mockPlayer,
                { roundId, result: mockResult, settlementResult: expectedSettlementResult, odds: mockRoundData.odds, board: mockBoard },
                lightningPayload
            );
            expect(settleGameRoundConsumer.settleBet).toHaveBeenCalledWith(mockRound);
            expect(result).toEqual({
                roundId,
                result: mockResult,
                settlementResult: expectedSettlementResult,
                winAmount: 4000,
                amount: 100,
                reachMaxWin: false,
                time: mockDate,
                gameMode: 3,
                numberOfRows: 16,
                odds: mockRoundData.odds,
                lightningBoard: mockBoard,
            });
        });
    });

    describe("getMaxWinPerRound", () => {
        it("should return max win per round when max bet is less than max win per round", () => {
            // Arrange
            mockPlayer.profile.maxBet = 2000;
            const result = settleGameRoundConsumer.getMaxWinPerRound(mockPlayer);
            expect(result).toBe(1000);
        });

        it("should return player max bet when max bet is greater than max win per round", () => {
            // Arrange
            mockPlayer.profile.maxBet = 200;
            const result = settleGameRoundConsumer.getMaxWinPerRound(mockPlayer);
            expect(result).toBe(200);
        });

        it("should return 0 when currency group game is not found", () => {
            // Arrange
            mockPlayer.session.currencyGroupId = "group2";
            const result = settleGameRoundConsumer.getMaxWinPerRound(mockPlayer);
            expect(result).toBe(0);
        });

        it("should return 0 when player max bet is not set", () => {
            // Arrange
            mockPlayer.profile.maxBet = undefined;
            const result = settleGameRoundConsumer.getMaxWinPerRound(mockPlayer);
            expect(result).toBe(0);
        });
    });

    describe("createNewRoundDocument", () => {
        it("should create round document with correct structure", async () => {
            // Arrange
            const roundId = 123;
            const result = [1, 0, 0, 0, 0, 1, 0, 0, 0];
            const settlementResult: SettlementResult = {
                slotIndex: 2,
                multiplier: 2.5,
            };
            const expectedRound: PlinkoRound = {
                id: roundId,
                uid: mockPlayer.UID,
                name: mockPlayer.profile.name,
                amount: 100,
                totalAmount: 100,
                betWin: 250, // 100 * 2.5
                reachMaxWin: false,
                paid: true,
                rate: 1,
                odds: mockGameData.gameConfigs.plinkoConfig.odds,
                time: mockDate,
                clientSeed: "test-seed",
                currency: "USD",
                siteId: "site1",
                siteName: "site1",
                playerId: "player1",
                operatorId: "op1",
                appType: 10,
                gameMode: 1,
                numberOfRows: 12,
                lightningKey: undefined,
                lightningBoard: null,
                result,
                settlementResult,
                exchangeRateId: 123,
            };

            mockRoundsRepository.create.mockResolvedValue(expectedRound);

            // Act
            const resultRound = await settleGameRoundConsumer.createNewRoundDocument(
                mockPlayer,
                { roundId, result, settlementResult, odds: mockGameData.gameConfigs.plinkoConfig.odds, board: null },
                mockPayload
            );

            // Assert
            expect(mockRoundsRepository.create).toHaveBeenCalledWith(expectedRound);
            expect(resultRound).toEqual(expectedRound);
        });

        it("should create round document with reachMaxWin true if bet win is equal to max win per round", async () => {
            // Arrange
            const roundId = 123;
            const result = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            const settlementResult: SettlementResult = {
                slotIndex: 0,
                multiplier: 5000,
            };
            const payload = {
                amount: 1000,
                gameMode: 1,
                numberOfRows: 16,
                clientSeed: "1234",
            };
            const expectedRound: PlinkoRound = {
                id: roundId,
                uid: mockPlayer.UID,
                name: mockPlayer.profile.name,
                amount: 1000,
                totalAmount: 1000,
                betWin: 1000,
                reachMaxWin: true,
                paid: true,
                rate: 1,
                odds: mockGameData.gameConfigs.plinkoConfig.odds,
                time: mockDate,
                clientSeed: "1234",
                currency: "USD",
                siteId: "site1",
                siteName: "site1",
                playerId: "player1",
                operatorId: "op1",
                appType: 10,
                gameMode: 1,
                numberOfRows: 16,
                lightningKey: undefined,
                lightningBoard: null,
                result,
                settlementResult,
                exchangeRateId: 123,
            };
            mockRoundsRepository.create.mockResolvedValue(expectedRound);

            // Act
            const resultRound = await settleGameRoundConsumer.createNewRoundDocument(
                mockPlayer,
                { roundId, result, settlementResult, odds: mockGameData.gameConfigs.plinkoConfig.odds, board: null },
                payload
            );

            // Assert
            expect(mockRoundsRepository.create).toHaveBeenCalledWith(expectedRound);
            expect(resultRound).toEqual(expectedRound);
        });
    });

    describe("settleBet", () => {
        it("should call end game with correct bet result", async () => {
            // Arrange
            const mockRound = {
                id: 123,
                amount: 100,
                betWin: 250,
                result: [1, 0, 0, 0, 0, 0, 0, 0, 0],
                settlementResult: { slotIndex: 1, multiplier: 2.5 },
                time: mockDate,
            } as PlinkoRound;

            // Act
            await settleGameRoundConsumer.settleBet(mockRound);

            // Assert
            expect(mockCallEndGame).toHaveBeenCalledWith(
                mockRound,
                mockRound.id,
                mockRound.time,
                {
                    totalBetAmount: 100,
                    totalWin: 250,
                    netWin: 150, // 250 - 100
                    totalLost: 0,
                    winningByChoices: {},
                },
                {}
            );
        });
    });

    describe("calculateBetResult", () => {
        it("should calculate bet result correctly", () => {
            // Arrange
            const mockRound = {
                id: 123,
                amount: 100,
                betWin: 250,
            } as PlinkoRound;

            // Act
            const result = settleGameRoundConsumer.calculateBetResult(mockRound);

            // Assert
            expect(result).toEqual({
                totalBetAmount: 100,
                totalWin: 250,
                netWin: 150,
                totalLost: 0,
                winningByChoices: {},
            });
        });
    });
});
