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
            playerBetList: [],
        };

        // Create instance
        // @ts-ignore
        bot = new Bot();
        bot.gameData = mockGameData;
    });

    describe("run", () => {
        beforeEach(() => {
            // Mock chance methods
            bot.chance = {
                integer: jest.fn(),
                pickone: jest.fn(),
            } as any;
            bot.placeBet = jest.fn();
        });

        it("should not run when bots array is empty", async () => {
            // Arrange
            bot.bots = [];
            mockGameData.gameConfigs.botenabled = true;

            // Act
            await bot.run();

            // Assert
            expect(bot.chance.integer).not.toHaveBeenCalled();
            expect(bot.chance.pickone).not.toHaveBeenCalled();
            expect(bot.placeBet).not.toHaveBeenCalled();
        });

        it("should not run when botenabled is false", async () => {
            // Arrange
            bot.bots = [{ name: "Bot1" }];
            mockGameData.gameConfigs.botenabled = false;

            // Act
            await bot.run();

            // Assert
            expect(bot.chance.integer).not.toHaveBeenCalled();
            expect(bot.chance.pickone).not.toHaveBeenCalled();
            expect(bot.placeBet).not.toHaveBeenCalled();
        });

        it("should not run when botenabled is undefined", async () => {
            // Arrange
            bot.bots = [{ name: "Bot1" }];
            mockGameData.gameConfigs.botenabled = undefined;

            // Act
            await bot.run();

            // Assert
            expect(bot.chance.integer).not.toHaveBeenCalled();
            expect(bot.chance.pickone).not.toHaveBeenCalled();
            expect(bot.placeBet).not.toHaveBeenCalled();
        });

        it("should not run when gameConfigs is undefined", async () => {
            // Arrange
            bot.bots = [{ name: "Bot1" }];
            mockGameData.gameConfigs = undefined;

            // Act
            await bot.run();

            // Assert
            expect(bot.chance.integer).not.toHaveBeenCalled();
            expect(bot.chance.pickone).not.toHaveBeenCalled();
            expect(bot.placeBet).not.toHaveBeenCalled();
        });

        it("should run and place bets for selected bots when conditions are met", async () => {
            // Arrange
            const mockBots = [{ name: "Bot1" }, { name: "Bot2" }, { name: "Bot3" }];
            bot.bots = mockBots;
            mockGameData.gameConfigs.botenabled = true;
            (bot.chance.integer as jest.Mock).mockReturnValue(2);
            (bot.chance.pickone as jest.Mock).mockReturnValueOnce(mockBots[0]).mockReturnValueOnce(mockBots[1]);

            // Act
            await bot.run();

            // Assert
            expect(bot.chance.integer).toHaveBeenCalledWith({ min: 1, max: 3 });
            expect(bot.chance.pickone).toHaveBeenCalledTimes(2);
            expect(bot.chance.pickone).toHaveBeenCalledWith(mockBots);
            expect(bot.placeBet).toHaveBeenCalledTimes(2);
            expect(bot.placeBet).toHaveBeenCalledWith(mockBots[0]);
            expect(bot.placeBet).toHaveBeenCalledWith(mockBots[1]);
        });

        it("should run with minimum number of bots when chance.integer returns 1", async () => {
            // Arrange
            const mockBots = [{ name: "Bot1" }, { name: "Bot2" }];
            bot.bots = mockBots;
            mockGameData.gameConfigs.botenabled = true;
            (bot.chance.integer as jest.Mock).mockReturnValue(1);
            (bot.chance.pickone as jest.Mock).mockReturnValue(mockBots[0]);

            // Act
            await bot.run();

            // Assert
            expect(bot.chance.integer).toHaveBeenCalledWith({ min: 1, max: 2 });
            expect(bot.chance.pickone).toHaveBeenCalledTimes(1);
            expect(bot.placeBet).toHaveBeenCalledTimes(1);
            expect(bot.placeBet).toHaveBeenCalledWith(mockBots[0]);
        });

        it("should run with maximum number of bots when chance.integer returns bots.length", async () => {
            // Arrange
            const mockBots = [{ name: "Bot1" }, { name: "Bot2" }];
            bot.bots = mockBots;
            mockGameData.gameConfigs.botenabled = true;
            (bot.chance.integer as jest.Mock).mockReturnValue(2);
            (bot.chance.pickone as jest.Mock).mockReturnValueOnce(mockBots[0]).mockReturnValueOnce(mockBots[1]);

            // Act
            await bot.run();

            // Assert
            expect(bot.chance.integer).toHaveBeenCalledWith({ min: 1, max: 2 });
            expect(bot.chance.pickone).toHaveBeenCalledTimes(2);
            expect(bot.placeBet).toHaveBeenCalledTimes(2);
        });

        it("should handle case when chance.pickone returns null/undefined", async () => {
            // Arrange
            const mockBots = [{ name: "Bot1" }, { name: "Bot2" }];
            bot.bots = mockBots;
            mockGameData.gameConfigs.botenabled = true;
            (bot.chance.integer as jest.Mock).mockReturnValue(2);
            (bot.chance.pickone as jest.Mock).mockReturnValueOnce(mockBots[0]).mockReturnValueOnce(null);

            // Act
            await bot.run();

            // Assert
            expect(bot.chance.integer).toHaveBeenCalledWith({ min: 1, max: 2 });
            expect(bot.chance.pickone).toHaveBeenCalledTimes(2);
            expect(bot.placeBet).toHaveBeenCalledTimes(1);
            expect(bot.placeBet).toHaveBeenCalledWith(mockBots[0]);
        });

        it("should handle case when chance.pickone returns undefined", async () => {
            // Arrange
            const mockBots = [{ name: "Bot1" }, { name: "Bot2" }];
            bot.bots = mockBots;
            mockGameData.gameConfigs.botenabled = true;
            (bot.chance.integer as jest.Mock).mockReturnValue(2);
            (bot.chance.pickone as jest.Mock).mockReturnValueOnce(mockBots[0]).mockReturnValueOnce(undefined);

            // Act
            await bot.run();

            // Assert
            expect(bot.chance.integer).toHaveBeenCalledWith({ min: 1, max: 2 });
            expect(bot.chance.pickone).toHaveBeenCalledTimes(2);
            expect(bot.placeBet).toHaveBeenCalledTimes(1);
            expect(bot.placeBet).toHaveBeenCalledWith(mockBots[0]);
        });

        it("should handle placeBet throwing an error gracefully", async () => {
            // Arrange
            const mockBots = [{ name: "Bot1" }, { name: "Bot2" }];
            bot.bots = mockBots;
            mockGameData.gameConfigs.botenabled = true;
            (bot.chance.integer as jest.Mock).mockReturnValue(2);
            (bot.chance.pickone as jest.Mock).mockReturnValueOnce(mockBots[0]).mockReturnValueOnce(mockBots[1]);
            (bot.placeBet as jest.Mock).mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("Place bet failed"));

            // Act & Assert
            await expect(bot.run()).rejects.toThrow("Place bet failed");
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
            expect(helpers.numberHelper.getRandomNumberStep5).toHaveBeenCalledWith(minBet, maxBet, false);
            expect(bot.getMultiplier).toHaveBeenCalledWith();
            expect(mockGameData.playerBetList.length).toBe(1);
            expect(mockGameData.playerBetList).toEqual([
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
