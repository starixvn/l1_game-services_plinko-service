import Bot from "../../../src/crons/bot";
import { GAME_MODE, NUMBER_OF_ROWS } from "../../../src/constants";
import { helpers } from "sc-common";

// Mock the base class
const mockSuperConstructor = jest.fn();

jest.mock("sc-game-base/src/core/crons", () => ({
    BaseBot: class {
        constructor(definition: any, gameData: any, gameManagementApiClientFactory: any) {
            mockSuperConstructor(definition, gameData, gameManagementApiClientFactory);
            return this;
        }
    },
}));

jest.mock("sc-common", () => ({
    helpers: {
        numberHelper: {
            getRandomNumberStep5: jest.fn(),
        },
    },
}));

describe("Bot", () => {
    let bot: Bot;
    let mockDefinition: any;
    let mockGameData: any;
    let mockGameManagementApiClientFactory: any;
    let mockPlaceBetPublisher: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockDefinition = {};
        mockGameData = {
            gameConfigs: {
                bot_maxbet: 100,
                name: "Plinko",
                plinkoConfig: {
                    odds: {
                        [GAME_MODE.LOW]: {
                            [NUMBER_OF_ROWS.min]: [1, 2, 3, 4, 5, 6, 7, 8, 9],
                            [NUMBER_OF_ROWS.max]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
                        },
                        [GAME_MODE.MEDIUM]: {
                            [NUMBER_OF_ROWS.min]: [1, 2, 3, 4, 5, 6, 7, 8, 9],
                            [NUMBER_OF_ROWS.max]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
                        },
                        [GAME_MODE.HIGH]: {
                            [NUMBER_OF_ROWS.min]: [1, 2, 3, 4, 5, 6, 7, 8, 9],
                            [NUMBER_OF_ROWS.max]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
                        },
                    },
                },
            },
        };
        mockGameManagementApiClientFactory = {};
        mockPlaceBetPublisher = {
            publishPlayerBetResult: jest.fn(),
        };

        // Create instance
        bot = new Bot(mockDefinition, mockGameData, mockGameManagementApiClientFactory, mockPlaceBetPublisher);
        bot.gameData = mockGameData;
    });

    describe("constructor", () => {
        it("should initialize with correct dependencies", () => {
            // Assert
            expect(mockSuperConstructor).toHaveBeenCalledWith(mockDefinition, mockGameData, mockGameManagementApiClientFactory);
            expect(bot.placeBetPublisher).toBe(mockPlaceBetPublisher);
        });
    });

    describe("isDuringBetTime", () => {
        it("should return true", () => {
            // Act
            const result = bot.isDuringBetTime();

            // Assert
            expect(result).toBe(true);
        });
    });

    describe("placeBet", () => {
        it("should calculate bet amount and publish result", async () => {
            // Arrange
            const mockBotPlayer = { name: "TestBot" };
            const minBet = 10;
            const maxBet = 100;
            const randomAmount = 50;
            const expectedBetWin = 150;

            (helpers.numberHelper.getRandomNumberStep5 as jest.Mock).mockReturnValue(randomAmount);
            bot.getMinBet = jest.fn().mockReturnValue(minBet);
            bot.getMaxBet = jest.fn().mockReturnValue(maxBet);
            bot.calculateBetWin = jest.fn().mockReturnValue(expectedBetWin);

            // Act
            await bot.placeBet(mockBotPlayer);

            // Assert
            expect(bot.getMinBet).toHaveBeenCalled();
            expect(bot.getMaxBet).toHaveBeenCalledWith(mockBotPlayer, "");
            expect(helpers.numberHelper.getRandomNumberStep5).toHaveBeenCalledWith(minBet, maxBet, true);
            expect(bot.calculateBetWin).toHaveBeenCalledWith(randomAmount);
            expect(mockPlaceBetPublisher.publishPlayerBetResult).toHaveBeenCalledWith("TestBot", randomAmount, expectedBetWin);
        });
    });

    describe("calculateBetWin", () => {
        beforeEach(() => {
            // Mock Math.random to return consistent values for testing
            jest.spyOn(Math, "random").mockReturnValue(0.3);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("should calculate win amount with medium game mode and max rows", () => {
            // Arrange
            const amount = 100;
            const expectedMultiplier = 1;

            // Act
            const result = bot.calculateBetWin(amount);

            // Assert
            expect(result).toBe(amount * expectedMultiplier);
        });

        it("should calculate win amount with specified game mode and row count", () => {
            // Arrange
            const amount = 50;
            const gameMode = GAME_MODE.LOW;
            const numberOfRows = NUMBER_OF_ROWS.min;
            const expectedMultiplier = 1;

            // Act
            const result = bot.calculateBetWin(amount, gameMode, numberOfRows);

            // Assert
            expect(result).toBe(amount * expectedMultiplier);
        });

        it("should return amount multiplied by 1 when odds are not available", () => {
            // Arrange
            const amount = 25;
            const gameMode = 999; // Invalid game mode
            const numberOfRows = 999; // Invalid row count

            // Act
            const result = bot.calculateBetWin(amount, gameMode, numberOfRows);

            // Assert
            expect(result).toBe(amount * 1);
        });

        it("should calculate win with zero slot index", () => {
            // Arrange
            jest.spyOn(Math, "random").mockReturnValue(0.8);
            const amount = 75;

            // Act
            const result = bot.calculateBetWin(amount);

            // Assert
            expect(result).toBe(amount * 17);
        });
    });

    describe("getMaxBet", () => {
        it("should return bot_maxbet from gameConfigs when available", () => {
            // Act
            const result = bot.getMaxBet({}, "");

            // Assert
            expect(result).toBe(100);
        });

        it("should return 1 when bot_maxbet is not set in gameConfigs", () => {
            // Arrange
            mockGameData.gameConfigs.bot_maxbet = undefined;

            // Act
            const result = bot.getMaxBet({}, "");

            // Assert
            expect(result).toBe(1);
        });

        it("should return 1 when gameConfigs is missing", () => {
            // Arrange
            mockGameData.gameConfigs = {};

            // Act
            const result = bot.getMaxBet({}, "");

            // Assert
            expect(result).toBe(1);
        });
    });
});
