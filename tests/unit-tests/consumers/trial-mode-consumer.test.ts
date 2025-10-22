import TrialModeConsumer from "../../../src/consumers/trial-mode-consumer";
import { Helpers } from "sc-game-base/src/core";

jest.mock("sc-game-base/src/core", () => ({
    Helpers: {
        ServerSeedHelper: {
            generateServerSeed: jest.fn(),
        },
        SeedHelper: {
            getSHA512Hash: jest.fn(),
        },
    },
}));

describe("TrialModeConsumer", () => {
    let trialModeConsumer: TrialModeConsumer;
    let mockGameData: any;
    let mockPublisher: any;
    let mockDefinition: any;
    let mockPlayer: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mocks
        mockGameData = {
            ingame: {
                testPlayer: {
                    numberOfRows: 8,
                    gameMode: 1,
                    amount: 100,
                    clientSeed: "test-seed",
                },
            },
            gameConfigs: {
                plinkoConfig: {
                    odds: {
                        1: {
                            8: [1, 2, 2.5, 4, 5, 6, 7, 8, 9],
                        },
                    },
                },
            },
        };

        mockDefinition = {
            generateResult: jest.fn(),
            settle: jest.fn(),
        };

        mockPlayer = {
            UID: "player123",
            profile: {
                name: "testPlayer",
            },
        };

        mockPublisher = {
            publishToUser: jest.fn(),
        };

        // Create instance
        trialModeConsumer = new TrialModeConsumer({ definition: mockDefinition, gameData: mockGameData, publisher: mockPublisher });
    });

    describe("consume", () => {
        it("should successfully consume a trial mode", () => {
            // Arrange
            const mockDate = new Date("2025-01-01T00:00:00Z");
            jest.spyOn(global, "Date").mockImplementation(() => mockDate);
            (Helpers.ServerSeedHelper.generateServerSeed as jest.Mock).mockReturnValue("serverSeed");
            (Helpers.SeedHelper.getSHA512Hash as jest.Mock).mockReturnValue("finalHash");
            const mockResult = [1, 1, 0, 0, 0, 0, 0, 0];
            mockDefinition.generateResult.mockReturnValue(mockResult);
            mockDefinition.settle.mockReturnValue(2);
            const expectedFinish = {
                gameMode: 1,
                numberOfRows: 8,
                odds: mockGameData.gameConfigs.plinkoConfig.odds,
                result: mockResult,
                settlementResult: { slotIndex: 2, multiplier: 2.5 },
                winAmount: 0,
                amount: 0,
                reachMaxWin: false,
                time: mockDate,
            };

            // Act
            trialModeConsumer.consume(mockPlayer);

            // Assert
            expect(mockPublisher.publishToUser).toHaveBeenCalledWith(mockPlayer.UID, {
                endBet: 0,
                ownBets: { gameMode: 1, numberOfRows: 8 },
                finish: expectedFinish,
            });
        });
    });
});
