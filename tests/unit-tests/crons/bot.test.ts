import Bot from "../../../src/crons/bot";
import { GAME_MODE, NUMBER_OF_ROWS } from "../../../src/constants";
import { helpers } from "sc-common";

jest.mock("sc-game-base/src/core/crons", () => ({
    BaseBot: class {
        constructor() {
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
    let mockGameData: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockGameData = {
            gameConfigs: {
                bot_maxbet: 100,
                bot_minbet: 10,
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
            playerResultBoard: [],
        };

        // Create instance
        // @ts-ignore
        bot = new Bot();
        bot.gameData = mockGameData;
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
            const expectedMultiplier = 1.5;
            const expectedBetWin = randomAmount * expectedMultiplier;

            (helpers.numberHelper.getRandomNumberStep5 as jest.Mock).mockReturnValue(randomAmount);
            bot.getMinBet = jest.fn().mockReturnValue(minBet);
            bot.getMaxBet = jest.fn().mockReturnValue(maxBet);
            bot.getMultiplier = jest.fn().mockReturnValue(expectedMultiplier);

            // Act
            await bot.placeBet(mockBotPlayer);

            // Assert
            expect(bot.getMinBet).toHaveBeenCalled();
            expect(bot.getMaxBet).toHaveBeenCalledWith(mockBotPlayer, "");
            expect(helpers.numberHelper.getRandomNumberStep5).toHaveBeenCalledWith(minBet, maxBet, true);
            expect(bot.getMultiplier).toHaveBeenCalledWith();
            expect(mockGameData.playerResultBoard.length).toBe(1);
            expect(mockGameData.playerResultBoard).toEqual([
                {
                    playerName: "TestBot",
                    amount: randomAmount,
                    winAmount: expectedBetWin,
                    multiplier: expectedMultiplier,
                },
            ]);
        });
    });

    describe("getMultiplier", () => {
        beforeEach(() => {
            // Mock Math.random to return consistent values for testing
            jest.spyOn(Math, "random").mockReturnValue(0.3);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("should calculate win amount with medium game mode and max rows", () => {
            // Act
            const result = bot.getMultiplier();

            // Assert
            expect(result).toBe(1);
        });

        it("should calculate win amount with specified game mode and row count", () => {
            // Arrange
            const gameMode = GAME_MODE.LOW;
            const numberOfRows = NUMBER_OF_ROWS.min;

            // Act
            const result = bot.getMultiplier(gameMode, numberOfRows);

            // Assert
            expect(result).toBe(1);
        });

        it("should return amount multiplied by 1 when odds are not available", () => {
            // Arrange
            const gameMode = 999; // Invalid game mode
            const numberOfRows = 999; // Invalid row count

            // Act
            const result = bot.getMultiplier(gameMode, numberOfRows);

            // Assert
            expect(result).toBe(1);
        });

        it("should calculate win with zero slot index", () => {
            // Arrange
            jest.spyOn(Math, "random").mockReturnValue(0.8);

            // Act
            const result = bot.getMultiplier();

            // Assert
            expect(result).toBe(17);
        });
    });

    describe("getMinBet", () => {
        it("should return bot_minbet from gameConfigs when available", () => {
            // Act
            const result = bot.getMinBet();

            // Assert
            expect(result).toBe(10);
        });

        it("should return 1 when bot_minbet is not set in gameConfigs", () => {
            // Arrange
            mockGameData.gameConfigs.bot_minbet = undefined;

            // Act
            const result = bot.getMinBet();

            // Assert
            expect(result).toBe(1);
        });

        it("should return 1 when bot_minbet is less than 1", () => {
            // Arrange
            mockGameData.gameConfigs.bot_minbet = 0;

            // Act
            const result = bot.getMinBet();

            // Assert
            expect(result).toBe(1);
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
