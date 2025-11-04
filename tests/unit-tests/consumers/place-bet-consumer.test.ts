import PlaceBetConsumer from "../../../src/consumers/place-bet-consumer";
import { GAME_MODE, NUMBER_OF_ROWS } from "../../../src/constants";
import { PlaceBetPayload } from "../../../src/types";
import { isValidLightningKey } from "../../../src/helpers/string-helper";

// Mock the base class
const mockValidateRequestParams = jest.fn();
const mockValidateBetRequest = jest.fn();
const mockGetNoticeObj = jest.fn();

jest.mock("sc-game-base/src/core/event-consumers", () => ({
    PlaceBetConsumer: class {
        validateRequestParams = mockValidateRequestParams;
        validateBetRequest = mockValidateBetRequest;
        getNoticeObj = mockGetNoticeObj;
        DisplayMode = { Landscape: "landscape" };
        constructor() {
            return this;
        }
    },
}));

// Mock notices
jest.mock("../../../src/constants/notices", () => ({
    processingAction: "processing_action",
}));

// Mock helpers
jest.mock("sc-common", () => ({
    helpers: {
        noticeHelper: {
            invalidBet: "invalid_bet",
            minBet: "min_bet",
            maxBet: "max_bet",
        },
    },
}));

jest.mock("../../../src/helpers/string-helper", () => ({
    isValidLightningKey: jest.fn(),
}));

describe("PlaceBetConsumer", () => {
    let placeBetConsumer: PlaceBetConsumer;
    let mockPlayer: any;
    let mockBetChoice: any;
    let mockAmount: number;
    let mockFreeBet: boolean;
    let mockRate: number;
    let mockGameData: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock game data
        mockGameData = {
            gameConfigs: { enabled: true, plinkoConfig: { enabledLightningMode: true } },
            ingame: {},
            currencyGroupGames: [{ groupId: "123", minBet: 10, maxBet: 1000 }],
        };

        // Setup mock player
        mockPlayer = {
            profile: {
                name: "testPlayer",
                minBet: 10,
                maxBet: 1000,
            },
            session: {
                currencyGroupId: "123",
            },
        };

        mockBetChoice = {};
        mockAmount = 100;
        mockFreeBet = false;
        mockRate = 1.0;

        // Create instance with mocked dependencies
        // @ts-ignore
        placeBetConsumer = new PlaceBetConsumer();
        placeBetConsumer.gameData = mockGameData;
        mockGetNoticeObj.mockImplementation((key, params) => ({ key, params }));
    });

    describe("composeValidationCriteria", () => {
        it("should return invalid bet notice when game config is disabled", () => {
            // Arrange
            mockGameData.gameConfigs.enabled = false;

            // Act
            const result = placeBetConsumer.composeValidationCriteria(mockPlayer, mockBetChoice, mockAmount, mockFreeBet, mockRate);

            // Assert
            expect(result).toHaveLength(4);
            expect(result[0].failure).toBe(true);
            expect(result[0].notice).toEqual({ key: "invalid_bet", params: undefined });
        });

        it("should return processing action notice when player has bet", () => {
            // Arrange
            mockGameData.ingame[mockPlayer.profile.name] = { hasBet: true };

            // Act
            const result = placeBetConsumer.composeValidationCriteria(mockPlayer, mockBetChoice, mockAmount, mockFreeBet, mockRate);

            // Assert
            expect(result).toHaveLength(4);
            expect(result[1].failure).toBe(true);
            expect(result[1].notice).toEqual({ key: "processing_action", params: undefined });
        });

        it("should return min bet notice when amount is less than min bet", () => {
            // Arrange
            mockAmount = 9;

            // Act
            const result = placeBetConsumer.composeValidationCriteria(mockPlayer, mockBetChoice, mockAmount, mockFreeBet, mockRate);

            // Assert
            expect(result).toHaveLength(4);
            expect(result[2].failure).toBe(true);
            expect(result[2].notice).toEqual({ key: "min_bet", params: { minBet: 10 } });
        });

        it("should return max bet notice when amount is greater than max bet", () => {
            // Arrange
            mockAmount = 1001;

            // Act
            const result = placeBetConsumer.composeValidationCriteria(mockPlayer, mockBetChoice, mockAmount, mockFreeBet, mockRate);

            // Assert
            expect(result).toHaveLength(4);
            expect(result[3].failure).toBe(true);
            expect(result[3].notice).toEqual({ key: "max_bet", params: { maxBet: 1000 } });
        });

        it("should not return any failure = true when amount is 0", () => {
            // Arrange
            mockAmount = 0;

            // Act
            const result = placeBetConsumer.composeValidationCriteria(mockPlayer, mockBetChoice, mockAmount, mockFreeBet, mockRate);

            // Assert
            expect(result).toHaveLength(4);
            expect(result.map((x) => x.failure)).toEqual([false, false, false, false]);
        });
    });

    describe("validateBetRequestParams", () => {
        it("should return valid when all parameters are correct", () => {
            // Arrange
            const payload: any = {
                amount: 100,
                numberOfRows: 12,
                gameMode: GAME_MODE.MEDIUM,
            };

            // Act
            const result = placeBetConsumer.validateBetRequestParams(payload);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].failure).toBe(false);
        });

        it("should return failure for invalid number of rows", () => {
            // Arrange
            const payload: any = {
                amount: 100,
                numberOfRows: 5, // Below minimum
                gameMode: GAME_MODE.MEDIUM,
            };

            // Act
            const result = placeBetConsumer.validateBetRequestParams(payload);

            // Assert
            expect(result[0].failure).toBe(true);
        });

        it("should return failure for missing number of rows", () => {
            // Arrange
            const payload: any = {
                amount: 100,
                gameMode: GAME_MODE.MEDIUM,
            };

            // Act
            const result = placeBetConsumer.validateBetRequestParams(payload);

            // Assert
            expect(result[0].failure).toBe(true);
        });

        it("should return failure for invalid game mode", () => {
            // Arrange
            const payload: any = {
                amount: 100,
                numberOfRows: 12,
                gameMode: 999, // Invalid mode
            };

            // Act
            const result = placeBetConsumer.validateBetRequestParams(payload);

            // Assert
            expect(result[0].failure).toBe(true);
        });

        it("should return failure for missing game mode", () => {
            // Arrange
            const payload: any = {
                amount: 100,
                numberOfRows: 12,
            };

            // Act
            const result = placeBetConsumer.validateBetRequestParams(payload);

            // Assert
            expect(result[0].failure).toBe(true);
        });

        describe("lightning mode", () => {
            const invalidLightningKey = ["test,", "", "123456789", null, undefined, 123, false, "test@"];
            invalidLightningKey.forEach((key) => {
                it(`should return failure for invalid lightning key: ${key}`, () => {
                    // Arrange
                    const payload: any = {
                        isLightningMode: true,
                        lightningKey: key,
                    };
                    (isValidLightningKey as jest.Mock).mockReturnValue(false);

                    // Act
                    const result = placeBetConsumer.validateBetRequestParams(payload);

                    // Assert
                    expect(result[0].failure).toBe(true);
                });
            });
            it("should return success for valid lightning key", () => {
                // Arrange
                const payload: any = {
                    isLightningMode: true,
                    lightningKey: "test",
                };
                (isValidLightningKey as jest.Mock).mockReturnValue(true);

                // Act
                const result = placeBetConsumer.validateBetRequestParams(payload);

                // Assert
                expect(result[0].failure).toBe(false);
            });
        });
    });

    describe("validateLightningRequest", () => {
        it("should return true when isLightningMode is false", () => {
            // Arrange
            const payload: any = {
                amount: 100,
                isLightningMode: false,
            };

            // Act
            const result = placeBetConsumer.validateLightningRequest(payload, mockPlayer);

            // Assert
            expect(result).toBe(true);
        });

        it("should return failure when lightning mode is disabled", () => {
            // Arrange
            const payload: any = {
                amount: 100,
                isLightningMode: true,
            };
            mockGameData.gameConfigs.plinkoConfig.enabledLightningMode = false;
            placeBetConsumer.verifyCriteria = jest.fn().mockReturnValue(false);

            // Act
            const result = placeBetConsumer.validateLightningRequest(payload, mockPlayer);

            // Assert
            expect(placeBetConsumer.verifyCriteria).toHaveBeenCalledWith(
                [{ failure: true, notice: { key: "invalid_bet", params: undefined } }],
                mockPlayer,
                ""
            );
            expect(result).toBe(false);
        });
    });

    describe("consume", () => {
        beforeEach(() => {
            mockValidateRequestParams.mockReturnValue(true);
            mockValidateBetRequest.mockReturnValue(true);
            placeBetConsumer.validateLightningRequest = jest.fn().mockReturnValue(true);
        });

        it("should successfully process a valid bet request", () => {
            // Arrange
            const payload: PlaceBetPayload = {
                amount: 100,
                numberOfRows: 12,
                gameMode: GAME_MODE.MEDIUM,
                clientSeed: "test-seed",
            };

            // Act
            placeBetConsumer.consume(mockPlayer, payload);

            // Assert
            expect(mockValidateRequestParams).toHaveBeenCalledWith(payload, mockPlayer);
            expect(mockValidateBetRequest).toHaveBeenCalledWith(mockPlayer, "", 100, false, 0);
            expect(payload.receivedTime).toBeInstanceOf(Date);
            expect(payload.mode).toBe("landscape");
            expect(payload.freeBet).toBe(false);
            expect(mockGameData.ingame[mockPlayer.profile.name]).toEqual({
                name: mockPlayer.profile.name,
                currency: mockPlayer.session.currencyName,
                system: mockPlayer.session.system,
                betTracks: {},
                betProcessing: false,
                betQueue: [{ player: mockPlayer, payload }],
                operatorId: mockPlayer.session.operatorId,
                amount: 100,
                clientSeed: "test-seed",
                hasBet: true,
            });
        });

        it("should successfully process a valid lightning bet request", () => {
            // Arrange
            const payload: any = {
                amount: 100,
                isLightningMode: true,
                lightningKey: "test",
                clientSeed: "test-seed",
            };

            // Act
            placeBetConsumer.consume(mockPlayer, payload);

            // Assert
            expect(mockValidateRequestParams).toHaveBeenCalledWith(payload, mockPlayer);
            expect(mockValidateBetRequest).toHaveBeenCalledWith(mockPlayer, "", 100, false, 0);
            expect(payload.receivedTime).toBeInstanceOf(Date);
            expect(payload.mode).toBe("landscape");
            expect(payload.freeBet).toBe(false);
            expect(payload.numberOfRows).toBe(NUMBER_OF_ROWS.lightning);
            expect(payload.gameMode).toBe(GAME_MODE.LIGHTNING);
            expect(mockGameData.ingame[mockPlayer.profile.name]).toEqual({
                name: mockPlayer.profile.name,
                currency: mockPlayer.session.currencyName,
                system: mockPlayer.session.system,
                betTracks: {},
                betProcessing: false,
                betQueue: [{ player: mockPlayer, payload }],
                operatorId: mockPlayer.session.operatorId,
                amount: 100,
                clientSeed: "test-seed",
                hasBet: true,
            });
        });

        it("should not process bet when validation request params fails", () => {
            // Arrange
            mockValidateRequestParams.mockReturnValue(false);
            const payload: any = {
                amount: 100,
                numberOfRows: 12,
                gameMode: GAME_MODE.MEDIUM,
            };

            // Act
            placeBetConsumer.consume(mockPlayer, payload);

            // Assert
            expect(mockValidateRequestParams).toHaveBeenCalledWith(payload, mockPlayer);
            expect(mockValidateBetRequest).not.toHaveBeenCalled();
            expect(mockGameData.ingame[mockPlayer.profile.name]).toBeUndefined();
        });

        it("should not process bet when validation bet request fails", () => {
            // Arrange
            mockValidateBetRequest.mockReturnValue(false);
            const payload: any = {
                amount: 100,
                numberOfRows: 12,
                gameMode: GAME_MODE.MEDIUM,
            };

            // Act
            placeBetConsumer.consume(mockPlayer, payload);

            // Assert
            expect(mockValidateRequestParams).toHaveBeenCalledWith(payload, mockPlayer);
            expect(mockValidateBetRequest).toHaveBeenCalledWith(mockPlayer, "", 100, false, 0);
            expect(mockGameData.ingame[mockPlayer.profile.name]).toBeUndefined();
        });

        it("should not process bet when validation lightning bet request fails", () => {
            // Arrange
            placeBetConsumer.validateLightningRequest = jest.fn().mockReturnValue(false);
            const payload: any = {
                amount: 100,
                isLightningMode: true,
                lightningKey: "test",
            };

            // Act
            placeBetConsumer.consume(mockPlayer, payload);

            // Assert
            expect(mockValidateRequestParams).toHaveBeenCalledWith(payload, mockPlayer);
            expect(placeBetConsumer.validateLightningRequest).toHaveBeenCalledWith(payload, mockPlayer);
            expect(mockValidateBetRequest).not.toHaveBeenCalled();
            expect(mockGameData.ingame[mockPlayer.profile.name]).toBeUndefined();
        });

        it("should process trial mode when amount is 0", () => {
            // Arrange
            const payload: any = {
                numberOfRows: 12,
                gameMode: GAME_MODE.MEDIUM,
                clientSeed: "test-seed",
            };

            // Act
            placeBetConsumer.consume(mockPlayer, payload);

            // Assert
            expect(mockValidateRequestParams).toHaveBeenCalledWith(payload, mockPlayer);
            expect(mockValidateBetRequest).toHaveBeenCalledWith(mockPlayer, "", 0, false, 0);
            expect(payload.receivedTime).toBeInstanceOf(Date);
            expect(payload.mode).toBe("landscape");
            expect(payload.freeBet).toBe(false);
            expect(mockGameData.ingame[mockPlayer.profile.name]).toEqual({
                name: mockPlayer.profile.name,
                currency: mockPlayer.session.currencyName,
                system: mockPlayer.session.system,
                betTracks: {},
                betProcessing: false,
                betQueue: [{ player: mockPlayer, payload }],
                operatorId: mockPlayer.session.operatorId,
                amount: 0,
                clientSeed: "test-seed",
                hasBet: true,
            });
        });
    });
});
