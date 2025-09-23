import GameCron from "../../../src/crons/game-cron";

// Mock the base class
const mockGetSettingForNewRound = jest.fn();
const mockUpdateExchangeRates = jest.fn();
const mockStartCron = jest.fn();
const mockCheckGameStatus = jest.fn();

jest.mock("sc-game-base/src/core/crons", () => ({
    BaseGameCron: class {
        getSettingForNewRound = mockGetSettingForNewRound;
        updateExchangeRates = mockUpdateExchangeRates;
        startCron = mockStartCron;
        checkGameStatus = mockCheckGameStatus;
        constructor() {
            return this;
        }
    },
}));

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
            publishPlayerResultBoard: jest.fn(),
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

        it("should publish player result board when remaining time is not equal to whole round duration and game is enabled", async () => {
            // Arrange
            mockGameData.remainingTime = 25;
            mockGameData.disabled = false;

            // Act
            await gameCron.proceed();

            // Assert
            expect(mockPublisher.publishPlayerResultBoard).toHaveBeenCalled();
        });

        it("should reset player result board when remaining time is not equal to whole round duration and game is enabled", async () => {
            // Arrange
            mockGameData.remainingTime = 25;
            mockGameData.disabled = false;
            mockGameData.playerResultBoard = [{ playerName: "testPlayer", amount: 100, winAmount: 100 }];

            // Act
            await gameCron.proceed();

            // Assert
            expect(mockGameData.playerResultBoard).toEqual([]);
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
});
