import GameCron from "../../../src/crons/game-cron";
import { maskName } from "../../../src/helpers/mask-name-helper";

// Mock the base class
const mockGetSettingForNewRound = jest.fn();
const mockUpdateExchangeRates = jest.fn();
const mockStartCron = jest.fn();
const mockCheckGameStatus = jest.fn();

jest.mock("sc-game-base/src/core", () => ({
    Crons: {
        BaseGameCron: class {
            getSettingForNewRound = mockGetSettingForNewRound;
            updateExchangeRates = mockUpdateExchangeRates;
            startCron = mockStartCron;
            checkGameStatus = mockCheckGameStatus;
            constructor() {
                return this;
            }
        },
    },
    BaseEventPublishers: {
        BaseEventPublisher: {},
    },
}));

jest.mock("../../../src/helpers/mask-name-helper", () => ({
    maskName: jest.fn(),
}));

const mockPickone = jest.fn();

jest.mock(
    "chance",
    () =>
        class {
            pickone = mockPickone;
        }
);

describe("GameCron", () => {
    let gameCron: GameCron;
    let mockBot: any;
    let mockDefinition: any;
    let mockGameData: any;
    let mockRoundIdConsumer: any;
    let mockPublisher: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mocks
        mockDefinition = {
            durations: {
                wholeRound: 30,
            },
        };
        mockGameData = {
            remainingTime: 30,
            disabled: false,
            playerResultBoard: [],
        };
        mockRoundIdConsumer = {
            initRoundId: jest.fn(),
        };
        mockBot = {
            reset: jest.fn(),
            run: jest.fn(),
        };
        mockPublisher = {
            publishToAllUsers: jest.fn(),
        };
        // Create instance
        // @ts-ignore
        gameCron = new GameCron({ publisher: mockPublisher });
        gameCron.definition = mockDefinition;
        gameCron.gameData = mockGameData;
        gameCron.roundIdConsumer = mockRoundIdConsumer;
        gameCron.bot = mockBot;
    });

    describe("start", () => {
        it("should initialize all required components in correct order", async () => {
            // Act
            await gameCron.start();

            // Assert
            expect(mockRoundIdConsumer.initRoundId).toHaveBeenCalled();
            expect(mockGetSettingForNewRound).toHaveBeenCalled();
            expect(mockUpdateExchangeRates).toHaveBeenCalled();
            expect(mockStartCron).toHaveBeenCalled();

            // Verify order of calls
            const initCallOrder = mockRoundIdConsumer.initRoundId.mock.invocationCallOrder[0];
            const settingsCallOrder = mockGetSettingForNewRound.mock.invocationCallOrder[0];
            const exchangeCallOrder = mockUpdateExchangeRates.mock.invocationCallOrder[0];
            const startCronCallOrder = mockStartCron.mock.invocationCallOrder[0];

            expect(initCallOrder).toBeLessThan(settingsCallOrder);
            expect(settingsCallOrder).toBeLessThan(exchangeCallOrder);
            expect(exchangeCallOrder).toBeLessThan(startCronCallOrder);
        });
    });

    describe("proceed", () => {
        it("should check game status when remaining time equals whole round duration", async () => {
            // Arrange
            mockGameData.remainingTime = 30; // Assuming this equals definition.durations.wholeRound
            gameCron.definition = { durations: { wholeRound: 30 } } as any;

            // Act
            await gameCron.proceed();

            // Assert
            expect(mockCheckGameStatus).toHaveBeenCalled();
        });

        it("should reset bot when remaining time equals whole round duration and game is enabled", async () => {
            // Arrange
            mockGameData.remainingTime = 30; // Assuming this equals definition.durations.wholeRound
            gameCron.definition = { durations: { wholeRound: 30 } } as any;
            mockGameData.disabled = false;

            // Act
            await gameCron.proceed();

            // Assert
            expect(mockBot.reset).toHaveBeenCalled();
        });

        it("should decrement remaining time when game is not disabled", async () => {
            // Arrange
            mockGameData.remainingTime = 25;
            mockGameData.disabled = false;

            // Act
            await gameCron.proceed();

            // Assert
            expect(mockCheckGameStatus).not.toHaveBeenCalled();
            expect(mockGameData.remainingTime).toBe(24);
        });

        it("should run bot when remaining time is not equal to whole round duration and game is enabled", async () => {
            // Arrange
            mockGameData.remainingTime = 25;
            mockGameData.disabled = false;

            // Act
            await gameCron.proceed();

            // Assert
            expect(mockBot.run).toHaveBeenCalled();
        });

        it("should publish player bet when remaining time is not equal to whole round duration and game is enabled", async () => {
            // Arrange
            mockGameData.remainingTime = 25;
            mockGameData.disabled = false;
            gameCron.publishPlayerBet = jest.fn();

            // Act
            await gameCron.proceed();

            // Assert
            expect(gameCron.publishPlayerBet).toHaveBeenCalled();
        });

        it("should reset player bet list when remaining time is not equal to whole round duration and game is enabled", async () => {
            // Arrange
            mockGameData.remainingTime = 25;
            mockGameData.disabled = false;
            mockGameData.playerBetList = [{ playerName: "testPlayer", amount: 100, winAmount: 100 }];
            gameCron.publishPlayerBet = jest.fn();

            // Act
            await gameCron.proceed();

            // Assert
            expect(mockGameData.playerBetList).toEqual([]);
        });

        it("should not decrement remaining time when game is disabled", async () => {
            // Arrange
            mockGameData.remainingTime = 30;
            mockGameData.disabled = true;

            // Act
            await gameCron.proceed();

            // Assert
            expect(mockGameData.remainingTime).toBe(30);
        });

        it("should handle remaining time of 0 correctly", async () => {
            // Arrange
            mockGameData.remainingTime = 0;
            mockGameData.disabled = false;

            // Act
            await gameCron.proceed();

            // Assert
            expect(mockGameData.remainingTime).toBe(30);
        });
    });

    describe("publishPlayerBet", () => {
        it("should not publish player bet if player bet list is empty", () => {
            // Act
            gameCron.publishPlayerBet();

            // Assert
            expect(mockPublisher.publishToAllUsers).not.toHaveBeenCalled();
        });

        it("should publish player bet if player bet list is not empty", () => {
            // Arrange
            mockGameData.playerBetList = [{ playerName: "testPlayer", amount: 100, winAmount: 100, multiplier: 1 }];
            mockPickone.mockReturnValue({ playerName: "testPlayer", amount: 100, winAmount: 100, multiplier: 1 });
            (maskName as jest.Mock).mockReturnValue("t***yer");

            // Act
            gameCron.publishPlayerBet();

            // Assert
            expect(mockPublisher.publishToAllUsers).toHaveBeenCalledWith({
                playerBet: { playerName: "t***yer", amount: 100, winAmount: 100, multiplier: 1 },
            });
        });

        it("should insert player bet into player result board if player result board is not empty", () => {
            // Arrange
            mockGameData.playerBetList = [{ playerName: "testPlayer", amount: 100, winAmount: 100, multiplier: 1 }];
            mockPickone.mockReturnValue({ playerName: "testPlayer", amount: 100, winAmount: 100, multiplier: 1 });
            (maskName as jest.Mock).mockReturnValue("t***yer");

            // Act
            gameCron.publishPlayerBet();

            // Assert
            expect(mockGameData.playerResultBoard).toEqual([{ playerName: "t***yer", amount: 100, winAmount: 100, multiplier: 1 }]);
        });

        it("should remove the last player bet from player result board if player result board length >= 10", () => {
            // Arrange
            mockGameData.playerResultBoard = [
                { playerName: "t***er1", amount: 100, winAmount: 100, multiplier: 1 },
                { playerName: "t***er2", amount: 100, winAmount: 100, multiplier: 1 },
                { playerName: "t***er3", amount: 100, winAmount: 100, multiplier: 1 },
                { playerName: "t***er4", amount: 100, winAmount: 100, multiplier: 1 },
                { playerName: "t***er5", amount: 100, winAmount: 100, multiplier: 1 },
                { playerName: "t***er6", amount: 100, winAmount: 100, multiplier: 1 },
                { playerName: "t***er7", amount: 100, winAmount: 100, multiplier: 1 },
                { playerName: "t***er8", amount: 100, winAmount: 100, multiplier: 1 },
                { playerName: "t***er9", amount: 100, winAmount: 100, multiplier: 1 },
                { playerName: "t***r10", amount: 100, winAmount: 100, multiplier: 1 },
            ];
            mockGameData.playerBetList = [{ playerName: "testPlayer", amount: 100, winAmount: 100, multiplier: 1 }];
            mockPickone.mockReturnValue({ playerName: "testPlayer", amount: 100, winAmount: 100, multiplier: 1 });
            (maskName as jest.Mock).mockReturnValue("t***yer");

            // Act
            gameCron.publishPlayerBet();

            // Assert
            expect(mockGameData.playerResultBoard.length).toEqual(10);
            expect(mockGameData.playerResultBoard[0]).toEqual({ playerName: "t***yer", amount: 100, winAmount: 100, multiplier: 1 });
            expect(mockGameData.playerResultBoard[9]).toEqual({ playerName: "t***er9", amount: 100, winAmount: 100, multiplier: 1 });
        });
    });
});
