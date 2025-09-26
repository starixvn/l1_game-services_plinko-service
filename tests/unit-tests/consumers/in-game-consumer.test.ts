import InGameConsumer from "../../../src/consumers/in-game-consumer";
import RoundQuery from "../../../src/query-apis/round-query";

// Mock the base class
const mockGetUserInfo = jest.fn();

jest.mock("sc-game-base/src/core/event-consumers", () => ({
    InGameConsumer: class {
        getUserInfo = mockGetUserInfo;
        constructor() {
            return this;
        }
    },
}));

// Mock RoundQuery
const mockGetListByPlayerId = jest.fn();

jest.mock("../../../src/query-apis/round-query", () => {
    return class MockRoundQuery {
        getListByPlayerId = mockGetListByPlayerId;
    };
});

describe("InGameConsumer", () => {
    let inGameConsumer: InGameConsumer;
    let mockRoundQuery: any;
    let mockGameData: any;
    let mockDefinition: any;
    let mockRealPlayer: any;
    let mockSocketClient: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mocks
        mockGameData = {
            gameConfigs: {
                enabled: true,
                plinkoConfig: {
                    odds: { 0: { 8: [1, 2, 3, 4, 5, 6, 7, 8, 9] } },
                },
            },
            umMessages: "Game disabled",
            exchangeRates: {
                code: {
                    USD: 1.0,
                },
            },
            currencyGroupGames: [{ groupId: "group1", minBet: 10, maxBet: 1000 }],
            playerResultBoard: [{ playerName: "otherPlayer", amount: 100, winAmount: 100, multiplier: 1 }],
        };

        mockDefinition = {
            name: "plinko",
            numberOfRoundHistory: 10,
        };

        mockSocketClient = {
            emit: jest.fn(),
        };

        mockRealPlayer = {
            UID: "player123",
            session: {
                currencyCode: "USD",
                multiplier: 1.0,
                currencyGroupId: "group1",
            },

            socketClient: mockSocketClient,
        };

        // Create RoundQuery mock
        mockRoundQuery = new RoundQuery(null, null);

        // Create instance
        // @ts-ignore
        inGameConsumer = new InGameConsumer();
        inGameConsumer.roundQuery = mockRoundQuery;
        inGameConsumer.gameData = mockGameData;
        inGameConsumer.definition = mockDefinition;
    });

    describe("consume", () => {
        it("should emit disabled message when game config is null", async () => {
            // Arrange
            mockGameData.gameConfigs = null; // Game disabled

            // Act
            await inGameConsumer.consume(mockRealPlayer);

            // Assert
            expect(mockSocketClient.emit).toHaveBeenCalledWith("plinko", {
                um: true,
                um_message: "Game disabled",
            });
        });

        it("should emit disabled message when game configs are disabled", async () => {
            // Arrange
            mockGameData.gameConfigs.enabled = false;

            // Act
            await inGameConsumer.consume(mockRealPlayer);

            // Assert
            expect(mockSocketClient.emit).toHaveBeenCalledWith("plinko", {
                um: true,
                um_message: "Game disabled",
            });
        });

        it("should build and emit payload when game is enabled", async () => {
            // Arrange
            const expectedPayload = {
                gameConfigs: { ...mockGameData.currencyGroupGames[0], odds: mockGameData.gameConfigs.plinkoConfig.odds },
                roundHistory: [],
                user: { balance: 1000, rate: 1.0 },
                playerResultBoard: mockGameData.playerResultBoard,
            };
            mockGetUserInfo.mockResolvedValueOnce({ balance: 1000 });
            mockGetListByPlayerId.mockResolvedValueOnce([]);

            // Act
            await inGameConsumer.consume(mockRealPlayer);

            // Assert
            expect(mockSocketClient.emit).not.toHaveBeenCalledWith("plinko", {
                um: false,
                um_message: "Game disabled",
            });
            expect(mockSocketClient.emit).toHaveBeenCalledWith("plinko", expectedPayload);
        });
    });
});
