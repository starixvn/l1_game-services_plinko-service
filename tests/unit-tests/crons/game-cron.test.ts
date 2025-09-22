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
    let mockDefinition: any;
    let mockGameData: any;
    let mockRoundIdConsumer: any;

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
        };
        mockRoundIdConsumer = {
            initRoundId: jest.fn(),
        };

        // Create instance
        // @ts-ignore
        gameCron = new GameCron();
        gameCron.definition = mockDefinition;
        gameCron.gameData = mockGameData;
        gameCron.roundIdConsumer = mockRoundIdConsumer;
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
        it("should check game status when remaining time equals whole round duration", () => {
            // Arrange
            mockGameData.remainingTime = 30; // Assuming this equals definition.durations.wholeRound
            gameCron.definition = { durations: { wholeRound: 30 } } as any;

            // Act
            gameCron.proceed();

            // Assert
            expect(mockCheckGameStatus).toHaveBeenCalled();
        });

        it("should decrement remaining time when game is not disabled", () => {
            // Arrange
            mockGameData.remainingTime = 25;
            mockGameData.disabled = false;

            // Act
            gameCron.proceed();

            // Assert
            expect(mockCheckGameStatus).not.toHaveBeenCalled();
            expect(mockGameData.remainingTime).toBe(24);
        });

        it("should not decrement remaining time when game is disabled", () => {
            // Arrange
            mockGameData.remainingTime = 30;
            mockGameData.disabled = true;

            // Act
            gameCron.proceed();

            // Assert
            expect(mockGameData.remainingTime).toBe(30);
        });

        it("should handle remaining time of 0 correctly", () => {
            // Arrange
            mockGameData.remainingTime = 0;
            mockGameData.disabled = false;

            // Act
            gameCron.proceed();

            // Assert
            expect(mockGameData.remainingTime).toBe(30);
        });
    });
});
