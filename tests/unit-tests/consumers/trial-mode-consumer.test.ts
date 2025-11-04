import { GAME_MODE, NUMBER_OF_ROWS } from "../../../src/constants";
import TrialModeConsumer from "../../../src/consumers/trial-mode-consumer";

describe("TrialModeConsumer", () => {
    let trialModeConsumer: TrialModeConsumer;
    let mockPublisher: any;
    let mockRoundResultConsumer: any;
    let mockPlayer: any;
    const mockDate = new Date("2025-01-01T00:00:00Z");

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mocks
        mockPlayer = {
            UID: "player123",
            profile: {
                name: "testPlayer",
            },
        };

        mockPublisher = {
            publishToUser: jest.fn(),
        };

        mockRoundResultConsumer = {
            generateRoundData: jest.fn(),
        };

        // Create instance
        trialModeConsumer = new TrialModeConsumer({
            roundResultConsumer: mockRoundResultConsumer,
            publisher: mockPublisher,
        });
        jest.spyOn(global, "Date").mockImplementation(() => mockDate);
    });

    describe("consume", () => {
        it("should successfully consume a trial mode", async () => {
            // Arrange
            const mockPayload: any = {
                amount: 100,
                numberOfRows: 8,
                gameMode: 1,
                clientSeed: "test-seed",
            };
            const mockResult = [1, 1, 0, 0, 0, 0, 0, 0];
            const roundData = {
                result: mockResult,
                settlementResult: { slotIndex: 2, multiplier: 2.5 },
                odds: { [GAME_MODE.LIGHTNING]: { [NUMBER_OF_ROWS.lightning]: [] } },
            };
            mockRoundResultConsumer.generateRoundData.mockResolvedValue(roundData);
            const expectedFinish = {
                gameMode: 1,
                numberOfRows: 8,
                odds: roundData.odds,
                result: roundData.result,
                settlementResult: roundData.settlementResult,
                winAmount: 0,
                amount: 0,
                reachMaxWin: false,
                time: mockDate,
            };

            // Act
            await trialModeConsumer.consume(mockPlayer, mockPayload);

            // Assert
            expect(mockRoundResultConsumer.generateRoundData).toHaveBeenCalledWith(mockPlayer.profile.name, 0, mockPayload);
            expect(mockPublisher.publishToUser).toHaveBeenCalledWith(mockPlayer.UID, {
                endBet: 0,
                ownBets: { gameMode: 1, numberOfRows: 8 },
                finish: expectedFinish,
            });
        });
    });
});
