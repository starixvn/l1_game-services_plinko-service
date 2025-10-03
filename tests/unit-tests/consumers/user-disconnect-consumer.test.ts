import UserDisconnectConsumer from "../../../src/consumers/user-disconnect-consumer";

// Mock the base class
const mockConsume = jest.fn();
jest.mock("sc-game-base/src/core/event-consumers", () => ({
    UserDisconnectConsumer: class {
        consume(socketClient: any) {
            mockConsume(socketClient);
        }
        constructor() {
            return this;
        }
    },
}));

describe("UserDisconnectConsumer", () => {
    let userDisconnectConsumer: UserDisconnectConsumer;
    let mockGameData: any;
    let mockSocketClient: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSocketClient = {
            id: "socket123",
        };
        mockGameData = {
            realPlayers: {
                socket123: {
                    UID: "player123",
                    profile: {
                        name: "player123",
                    },
                },
            },
            playerPf: {
                player123: {
                    serverSeedHash: "serverSeedHash",
                    serverSeed: "serverSeed",
                },
            },
        };
        // Create instance
        // @ts-ignore
        userDisconnectConsumer = new UserDisconnectConsumer();
        userDisconnectConsumer.gameData = mockGameData;
    });

    describe("consume", () => {
        it("should delete player pf when user disconnects", () => {
            // Act
            userDisconnectConsumer.consume(mockSocketClient);

            // Assert
            expect(mockGameData.playerPf).toEqual({});
        });

        it("should not delete player pf when user disconnects and profile name is not set", () => {
            // Arrange
            mockGameData.realPlayers.socket123.profile.name = undefined;

            // Act
            userDisconnectConsumer.consume(mockSocketClient);

            // Assert
            expect(mockGameData.playerPf.player123).toBeDefined();
        });

        it("should call super.consume", () => {
            // Act
            userDisconnectConsumer.consume(mockSocketClient);

            // Assert
            expect(mockConsume).toHaveBeenCalledWith(mockSocketClient);
        });
    });
});
