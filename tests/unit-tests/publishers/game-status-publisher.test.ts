import GameStatusPublisher from "../../../src/publishers/game-status-publisher";

// Mock the base class
jest.mock("sc-game-base/src/core/event-publishers", () => ({
    GameStatusPublisher: class {
        constructor() {
            return this;
        }
    },
}));

describe("GameStatusPublisher", () => {
    let gameStatusPublisher: GameStatusPublisher;
    let mockGameData: any;
    let mockSocketClient1: any;
    let mockSocketClient2: any;
    let mockRealPlayer1: any;
    let mockRealPlayer2: any;
    let mockRealPlayer3: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup socket client mocks
        mockSocketClient1 = {
            emit: jest.fn(),
        };

        mockSocketClient2 = {
            emit: jest.fn(),
        };

        // Setup real player mocks
        mockRealPlayer1 = {
            UID: "player1",
            session: {
                currencyGroupId: "group1",
            },
            socketClient: mockSocketClient1,
        };

        mockRealPlayer2 = {
            UID: "player2",
            session: {
                currencyGroupId: "group2",
            },
            socketClient: mockSocketClient2,
        };

        mockRealPlayer3 = {
            UID: "player3",
            session: {
                currencyGroupId: "group1",
            },
            socketClient: null, // No socket client
        };

        // Setup game data mock
        mockGameData = {
            gameConfigs: {
                plinkoConfig: {
                    odds: { 0: { 8: [1, 2, 3, 4, 5, 6, 7, 8, 9] } },
                    enabledLightningMode: true,
                },
            },
            currencyGroupGames: [
                {
                    groupId: "group1",
                    minBet: 10,
                    maxBet: 1000,
                    enabled: true,
                },
                {
                    groupId: "group2",
                    minBet: 5,
                    maxBet: 500,
                    enabled: true,
                },
            ],
            realPlayers: {
                player1: mockRealPlayer1,
                player2: mockRealPlayer2,
                player3: mockRealPlayer3,
            },
        };

        // Create instance
        // @ts-ignore
        gameStatusPublisher = new GameStatusPublisher();
        gameStatusPublisher.gameData = mockGameData;
        gameStatusPublisher.gameName = "plinko";
    });

    describe("publishEnablingGameStatus", () => {
        it("should emit payload to all players with socket clients", () => {
            // Arrange
            const expectedPayload1 = {
                gameConfigs: {
                    groupId: "group1",
                    minBet: 10,
                    maxBet: 1000,
                    enabled: true,
                    odds: { 0: { 8: [1, 2, 3, 4, 5, 6, 7, 8, 9] } },
                    enabledLightningMode: true,
                },
                snr: true,
            };

            const expectedPayload2 = {
                gameConfigs: {
                    groupId: "group2",
                    minBet: 5,
                    maxBet: 500,
                    enabled: true,
                    odds: { 0: { 8: [1, 2, 3, 4, 5, 6, 7, 8, 9] } },
                    enabledLightningMode: true,
                },
                snr: true,
            };

            // Act
            gameStatusPublisher.publishEnablingGameStatus();

            // Assert
            expect(mockSocketClient1.emit).toHaveBeenCalledWith("plinko", expectedPayload1);
            expect(mockSocketClient2.emit).toHaveBeenCalledWith("plinko", expectedPayload2);
        });
    });
});
