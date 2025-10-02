import { SettleGameRoundConsumer } from "../../../src/consumers";
import ProcessBetQueue from "../../../src/crons/process-bet-queue";
import { PlaceBetPayload } from "../../../src/types";
import { getChoiceId } from "../../../src/helpers/choice-mapper-helper";

// Mock the base class
const mockProceedBet = jest.fn();
const mockCalculateCurrencyRate = jest.fn();
const mockUpdateUserStakeLevel = jest.fn();
const mockPlaceBetPublisher = {
    publishToUser: jest.fn(),
};
const mockExecuteInterceptorEvent = jest.fn();
jest.mock("sc-game-base/src/core/crons", () => ({
    ProcessBetQueue: class {
        calculateCurrencyRate = mockCalculateCurrencyRate;
        updateUserStakeLevel = mockUpdateUserStakeLevel;
        placeBetPublisher = mockPlaceBetPublisher;
        executeInterceptorEvent = mockExecuteInterceptorEvent;
        async proceedBet(player: any, payload: any) {
            mockProceedBet(player, payload);
        }
        constructor() {}
    },
}));
// Mock Date
const mockDate = new Date("2024-01-01T00:00:00Z");
jest.spyOn(global, "Date").mockImplementation(() => mockDate);

// Mock SettleGameRoundConsumer
const mockSettle = jest.fn();

jest.mock("../../../src/consumers/settle-game-round-consumer", () => {
    return jest.fn().mockImplementation(() => ({
        settle: mockSettle,
    }));
});

jest.mock("../../../src/helpers/choice-mapper-helper", () => ({
    getChoiceId: jest.fn(),
}));

describe("ProcessBetQueue", () => {
    let processBetQueue: ProcessBetQueue;
    let mockSettleGameRoundConsumer: any;
    let mockGameData: any;
    let mockDefinition: any;
    let mockPlayer: any;
    let mockPayload: PlaceBetPayload;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mocks
        mockGameData = {
            roundId: 100,
            ingame: {},
            gameConfigs: { enabled: true, plinkoConfig: { numberOfGameModes: 3 } },
            playerResultBoard: [],
            betList: [],
            insertBetList: jest.fn(),
        };

        mockDefinition = {
            id: 123,
            choicesMapper: {},
            durations: {
                wholeRound: 30,
            },
        };

        mockPlayer = {
            profile: {
                name: "testPlayer",
                minBet: 10,
                maxBet: 1000,
            },
            session: {
                currencyGroupId: "group1",
            },
        };

        mockPayload = {
            amount: 100,
            numberOfRows: 12,
            gameMode: 1, // MEDIUM
            clientSeed: "test-seed",
            mode: "landscape",
        };

        // Create SettleGameRoundConsumer mock
        // @ts-ignore
        mockSettleGameRoundConsumer = new SettleGameRoundConsumer();

        // Create instance
        // @ts-ignore
        processBetQueue = new ProcessBetQueue({ settleGameRoundConsumer: mockSettleGameRoundConsumer });
        processBetQueue.gameData = mockGameData;
        processBetQueue.definition = mockDefinition;
    });

    describe("proceedBet", () => {
        it("should increment round ID, call parent proceedBet and reset bet data", async () => {
            // Arrange
            const initialRoundId = mockGameData.roundId;
            mockGameData.ingame[mockPlayer.profile.name] = {
                amount: 100,
                hasBet: true,
            };

            // Act
            await processBetQueue.proceedBet(mockPlayer, mockPayload);

            // Assert
            expect(mockGameData.roundId).toBe(initialRoundId + 1);
            expect(mockProceedBet).toHaveBeenCalledWith(mockPlayer, mockPayload);
            expect(mockGameData.ingame[mockPlayer.profile.name]).toBeUndefined();
        });
    });

    describe("formatApiBetInfo", () => {
        it("should format bet info correctly", () => {
            // Arrange
            mockPayload.gameMode = 0; // LOW
            mockPayload.numberOfRows = 10;
            (getChoiceId as jest.Mock).mockReturnValue(3);

            // Act
            const result = processBetQueue.formatApiBetInfo(mockPayload);

            // Assert
            expect(result).toEqual({
                amount: 100,
                gameId: 123,
                gameRoundId: 100,
                choiceId: 3,
                freeBet: false,
                clientSentTime: mockDate,
                metadata: {
                    mode: "landscape",
                },
            });
        });
    });

    describe("validateBetRequest", () => {
        it("should always return true", async () => {
            // Act
            const result = await processBetQueue.validateBetRequest(mockPlayer, mockPayload);

            // Assert
            expect(result).toBe(true);
        });
    });

    describe("handleSuccessBet", () => {
        it("should handle successful bet with stake level update", async () => {
            // Arrange
            const response = {
                minBet: 20,
                maxBet: 2000,
                balance: 1500,
            };
            const roundId = 101;
            const expectedRate = 1.5;
            const expectedPlacingBetResult = {
                endBet: 100,
                ownBets: { gameMode: 1, numberOfRows: 12 },
                user: response,
            };
            const expectedFinish = {
                result: [1, 0, 1, 0, 0, 0, 0, 0, 0],
                settlementResult: { slotIndex: 2, multiplier: 2.0 },
                winAmount: 200,
                amount: 100,
                reachMaxWin: false,
            };

            mockCalculateCurrencyRate.mockReturnValue(expectedRate);
            mockSettle.mockResolvedValue(expectedFinish);
            mockPlayer.profile.minBet = 10; // Different from response
            mockPlayer.profile.maxBet = 1000; // Different from response

            // Act
            await processBetQueue.handleSuccessBet(mockPlayer, response, roundId, mockPayload, null);

            // Assert
            expect(mockCalculateCurrencyRate).toHaveBeenCalledWith(mockPlayer.session);
            expect(mockUpdateUserStakeLevel).toHaveBeenCalledWith(mockPlayer, 20, 2000);
            expect(mockSettle).toHaveBeenCalledWith(mockPlayer, roundId, expectedRate);
            expect(mockPlaceBetPublisher.publishToUser).toHaveBeenCalledWith(mockPlayer.UID, {
                ...expectedPlacingBetResult,
                finish: expectedFinish,
            });
            expect(mockGameData.insertBetList).toHaveBeenCalledWith(
                mockPlayer.profile.name,
                mockPayload.amount,
                expectedFinish.winAmount,
                expectedFinish.settlementResult.multiplier,
                expectedRate
            );
        });

        it("should skip stake level update when values are same", async () => {
            // Arrange
            const response = {
                minBet: 10,
                maxBet: 1000,
                balance: 1500,
            };
            const roundId = 101;

            mockPlayer.profile.minBet = 10; // Same as response
            mockPlayer.profile.maxBet = 1000; // Same as response
            mockSettle.mockResolvedValue(null);

            // Act
            await processBetQueue.handleSuccessBet(mockPlayer, response, roundId, mockPayload, null);

            // Assert
            expect(mockUpdateUserStakeLevel).not.toHaveBeenCalled();
        });

        it("should execute interceptor event when applicableInterceptors is not null", async () => {
            // Arrange
            // Arrange
            const response = {
                minBet: 10,
                maxBet: 1000,
                balance: 1500,
            };
            const roundId = 101;
            const expectedRate = 1.5;
            const expectedPlacingBetResult = {
                endBet: 100,
                ownBets: { gameMode: 1, numberOfRows: 12 },
                user: response,
            };
            const expectedFinish = {
                result: [1, 0, 1, 0, 0, 0, 0, 0, 0],
                settlementResult: { slotIndex: 2, multiplier: 2.0 },
                winAmount: 200,
                amount: 100,
                reachMaxWin: false,
                time: mockDate,
            };

            mockCalculateCurrencyRate.mockReturnValue(expectedRate);
            mockSettle.mockResolvedValue(expectedFinish);

            // Act
            await processBetQueue.handleSuccessBet(mockPlayer, response, roundId, mockPayload, [{}]);

            // Assert
            expect(mockCalculateCurrencyRate).toHaveBeenCalledWith(mockPlayer.session);
            expect(mockSettle).toHaveBeenCalledWith(mockPlayer, roundId, expectedRate);
            expect(mockExecuteInterceptorEvent).toHaveBeenCalledWith("afterSuccessEvent", [{}], {
                player: mockPlayer,
                bet: mockPayload,
                balance: response,
                betTime: expectedFinish.time,
            });
        });
    });
});
