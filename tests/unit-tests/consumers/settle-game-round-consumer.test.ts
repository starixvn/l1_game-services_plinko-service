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

// Mock RoundResultConsumer
const mockGenerateResultByBet = jest.fn();

// Mock Date
const mockDate = new Date("2024-01-01T00:00:00Z");
jest.spyOn(global, "Date").mockImplementation(() => mockDate);

jest.mock("../../../src/consumers/round-result-consumer", () => {
    return class {
        generateResultByBet = mockGenerateResultByBet;
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

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mocks
        mockGameData = {
            ingame: {
                testPlayer: {
                    numberOfRows: 12,
                    gameMode: 1,
                    amount: 100,
                    clientSeed: "test-seed",
                },
            },
            gameConfigs: {
                plinkoConfig: {
                    odds: {
                        1: {
                            8: [1, 2, 2.5, 4, 5, 6, 7, 8, 9],
                            12: [1, 2, 2.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
                        },
                    },
                },
            },
            exchangeRates: {
                exId: 123,
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
            },
            session: {
                currencyName: "USD",
                siteId: "site1",
                playerId: "player1",
                operatorId: "op1",
                system: 10,
            },
        };

        // Create RoundResultConsumer mock
        // @ts-ignore
        mockRoundResultConsumer = new RoundResultConsumer();

        // Create instance
        // @ts-ignore
        settleGameRoundConsumer = new SettleGameRoundConsumer({ roundResultConsumer: mockRoundResultConsumer });
        settleGameRoundConsumer.roundResultConsumer = mockRoundResultConsumer;
        settleGameRoundConsumer.gameData = mockGameData;
        settleGameRoundConsumer.roundsRepository = mockRoundsRepository;
        settleGameRoundConsumer.definition = mockDefinition;
    });

    describe("settle", () => {
        it("should successfully settle a game round", async () => {
            // Arrange
            const roundId = 123;
            const rate = 1;
            const mockResult = [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            const slotIndex = 2;
            const expectedSettlementResult: SettlementResult = {
                slotIndex,
                multiplier: 2.5,
            };
            mockGenerateResultByBet.mockResolvedValue(mockResult);
            mockDefinition.settle.mockReturnValue(slotIndex);
            mockRoundsRepository.create.mockResolvedValue({ id: roundId, time: mockDate, amount: 100, betwin: 250 });

            // Act
            const result = await settleGameRoundConsumer.settle(mockPlayer, roundId, rate);

            // Assert
            expect(mockGenerateResultByBet).toHaveBeenCalledWith("testPlayer", roundId);
            expect(mockDefinition.settle).toHaveBeenCalledWith(mockResult);
            expect(result).toEqual({
                result: mockResult,
                settlementResult: expectedSettlementResult,
                winAmount: 250,
                amount: 100,
            });
        });

        it("should return null when round creation fails", async () => {
            // Arrange
            const roundId = 123;
            const rate = 1.5;
            const mockResult = [1, 0, 0, 0, 0, 0, 0, 0, 0];

            mockGenerateResultByBet.mockResolvedValue(mockResult);
            mockDefinition.settle.mockReturnValue(1);
            settleGameRoundConsumer.createNewRoundDocument = jest.fn().mockResolvedValue(null);
            settleGameRoundConsumer.settleBet = jest.fn();

            // Act
            const result = await settleGameRoundConsumer.settle(mockPlayer, roundId, rate);

            // Assert
            expect(result).toBeNull();
            expect(settleGameRoundConsumer.settleBet).not.toHaveBeenCalled();
        });

        it("should slice result to match number of rows", async () => {
            // Arrange
            const roundId = 123;
            const rate = 1.5;
            const fullResult = [1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1]; // 16 elements
            const expectedSlicedResult = [1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1]; // First 12 elements

            mockGenerateResultByBet.mockResolvedValue(fullResult);
            mockDefinition.settle.mockReturnValue(7);

            // Act
            await settleGameRoundConsumer.settle(mockPlayer, roundId, rate);

            // Assert
            expect(mockDefinition.settle).toHaveBeenCalledWith(expectedSlicedResult);
        });
    });

    describe("createNewRoundDocument", () => {
        it("should create round document with correct structure", async () => {
            // Arrange
            const roundId = 123;
            const rate = 1.5;
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
                betwin: 250, // 100 * 2.5
                paid: true,
                rate,
                odds: mockGameData.gameConfigs.plinkoConfig.odds,
                time: mockDate,
                clientSeed: "test-seed",
                currency: "USD",
                siteId: "site1",
                playerId: "player1",
                operatorId: "op1",
                appType: 10,
                gameMode: 1,
                numberOfRows: 12,
                result,
                settlementResult,
                freeBet: false,
                exchangeRateId: 123,
            };

            mockRoundsRepository.create.mockResolvedValue(expectedRound);

            // Act
            const resultRound = await settleGameRoundConsumer.createNewRoundDocument(mockPlayer, rate, roundId, result, settlementResult);

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
                betwin: 250,
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
                betwin: 250,
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
