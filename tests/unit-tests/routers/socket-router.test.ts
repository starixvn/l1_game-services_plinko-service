import SocketRouter from "../../../src/routers/socket-router";
import RoundQuery from "../../../src/query-apis/round-query";
import { LightningBoardAssigner } from "../../../src/lightning-feature/lightning-board-assigner";

const mockAssignBoard = jest.fn();
jest.mock("../../../src/lightning-feature/lightning-board-assigner", () => ({
    LightningBoardAssigner: class {
        assignBoard = mockAssignBoard;
        constructor() {}
    },
}));

describe("SocketRouter", () => {
    let socketRouter: SocketRouter;
    let mockRoundQuery: jest.Mocked<RoundQuery>;
    let mockVerify: jest.Mock;
    let mockGameData: any;
    let mockSocketClient: any;
    let mockDefinition: any;
    let mockLogService: any;
    let mockLightningBoardAssigner: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create mocks
        mockRoundQuery = {
            queryHistory: jest.fn(),
        } as any;

        mockVerify = jest.fn();
        mockGameData = {
            realPlayers: {
                socket123: { UID: "player123" },
            },
        };
        mockSocketClient = {
            id: "socket123",
            emit: jest.fn(),
        };
        mockDefinition = {
            name: "plinko",
            historyPageSize: 20,
        };
        mockLogService = {
            logError: jest.fn(),
        };
        mockLightningBoardAssigner = new LightningBoardAssigner({ logService: {} as any });
        // Create instance and inject mocks
        // @ts-ignore
        socketRouter = new SocketRouter({ lightningBoardAssigner: mockLightningBoardAssigner });
        socketRouter.roundQuery = mockRoundQuery;
        socketRouter.verify = mockVerify;
        socketRouter.gameData = mockGameData;
        socketRouter.socketClient = mockSocketClient;
        socketRouter.definition = mockDefinition;
        socketRouter.logService = mockLogService;
    });

    describe("handleGetHistory", () => {
        const mockPayload = { page: 2 };

        it("should return early when verification fails", async () => {
            // Arrange
            mockVerify.mockReturnValue(false);

            // Act
            await socketRouter.handleGetHistory(mockPayload);

            // Assert
            expect(mockVerify).toHaveBeenCalled();
            expect(mockRoundQuery.queryHistory).not.toHaveBeenCalled();
            expect(mockSocketClient.emit).not.toHaveBeenCalled();
            expect(mockLogService.logError).not.toHaveBeenCalled();
        });

        it("should successfully retrieve and emit history when verification passes", async () => {
            // Arrange
            const mockHistory = {
                history: {
                    betLogs: [],
                    page: 2,
                    pageSize: 20,
                    total: 0,
                },
            };

            mockVerify.mockReturnValue(true);
            mockRoundQuery.queryHistory.mockResolvedValue(mockHistory);

            // Act
            await socketRouter.handleGetHistory(mockPayload);

            // Assert
            expect(mockVerify).toHaveBeenCalled();
            expect(mockRoundQuery.queryHistory).toHaveBeenCalledWith(
                { UID: "player123" }, // player from gameData.realPlayers[socketClient.id]
                2, // payload.page
                20 // definition.historyPageSize
            );
            expect(mockSocketClient.emit).toHaveBeenCalledWith("plinko", mockHistory);
            expect(mockLogService.logError).not.toHaveBeenCalled();
        });

        it("should handle error during history retrieval and log it", async () => {
            // Arrange
            const mockError = new Error("Database connection failed");
            mockVerify.mockReturnValue(true);
            mockRoundQuery.queryHistory.mockRejectedValue(mockError);

            // Act
            await socketRouter.handleGetHistory(mockPayload);

            // Assert
            expect(mockVerify).toHaveBeenCalled();
            expect(mockRoundQuery.queryHistory).toHaveBeenCalledWith({ UID: "player123" }, 2, 20);
            expect(mockSocketClient.emit).not.toHaveBeenCalled();
            expect(mockLogService.logError).toHaveBeenCalledWith(mockError);
        });

        it("should pass correct parameters to queryHistory", async () => {
            // Arrange
            const mockHistory: any = { history: { betLogs: [] } };
            mockVerify.mockReturnValue(true);
            mockRoundQuery.queryHistory.mockResolvedValue(mockHistory);

            const testPayload = { page: 5 };

            // Act
            await socketRouter.handleGetHistory(testPayload);

            // Assert
            expect(mockRoundQuery.queryHistory).toHaveBeenCalledWith(
                mockGameData.realPlayers[mockSocketClient.id],
                testPayload.page,
                mockDefinition.historyPageSize
            );
        });

        it("should handle different page numbers correctly", async () => {
            // Arrange
            mockVerify.mockReturnValue(true);
            mockRoundQuery.queryHistory.mockResolvedValue({ history: { betLogs: [] } } as any);

            const testCases = [
                { page: 1, expectedPage: 1 },
                { page: 10, expectedPage: 10 },
                { page: 0, expectedPage: 0 }, // Edge case - should still pass through
            ];

            for (const testCase of testCases) {
                // Reset mock
                mockRoundQuery.queryHistory.mockClear();

                // Act
                await socketRouter.handleGetHistory({ page: testCase.page });

                // Assert
                expect(mockRoundQuery.queryHistory).toHaveBeenCalledWith({ UID: "player123" }, testCase.expectedPage, 20);
            }
        });

        it("should handle payload without page property", async () => {
            // Arrange
            mockVerify.mockReturnValue(true);
            mockRoundQuery.queryHistory.mockResolvedValue({ history: { betLogs: [] } } as any);

            const payloadWithoutPage = {};

            // Act
            await socketRouter.handleGetHistory(payloadWithoutPage);

            // Assert
            expect(mockRoundQuery.queryHistory).toHaveBeenCalledWith(
                { UID: "player123" },
                undefined, // payload.page is undefined
                20
            );
        });
    });

    describe("init", () => {
        it("should register getLightningConfig event listener on socket client", () => {
            // Arrange
            const mockSocketClientWithOn = {
                id: "socket123",
                on: jest.fn(),
            };

            // Act
            socketRouter.init(mockSocketClientWithOn);

            // Assert
            expect(mockSocketClientWithOn.on).toHaveBeenCalledWith("getLightningConfig", expect.any(Function));
        });
    });

    describe("getLightningConfig", () => {
        const mockPayload = { lightningKey: "test-key-123" };

        beforeEach(() => {
            mockGameData.gameConfigs = {
                plinkoConfig: {
                    enabledLightningMode: true,
                },
            };
            mockGameData.realPlayers["socket123"] = {
                UID: "player123",
                profile: {
                    name: "TestPlayer",
                },
            };
        });

        it("should return early when verification fails", async () => {
            // Arrange
            mockVerify.mockReturnValue(false);

            // Act
            await socketRouter.getLightningConfig(mockPayload);

            // Assert
            expect(mockVerify).toHaveBeenCalled();
            expect(mockAssignBoard).not.toHaveBeenCalled();
            expect(mockSocketClient.emit).not.toHaveBeenCalled();
            expect(mockLogService.logError).not.toHaveBeenCalled();
        });

        it("should return early when lightning mode is not enabled", async () => {
            // Arrange
            mockVerify.mockReturnValue(true);
            mockGameData.gameConfigs.plinkoConfig.enabledLightningMode = false;

            // Act
            await socketRouter.getLightningConfig(mockPayload);

            // Assert
            expect(mockVerify).toHaveBeenCalled();
            expect(mockAssignBoard).not.toHaveBeenCalled();
            expect(mockSocketClient.emit).not.toHaveBeenCalled();
            expect(mockLogService.logError).not.toHaveBeenCalled();
        });

        it("should successfully retrieve and emit lightning board when verification passes", async () => {
            // Arrange
            const mockBoard = {
                odds: [1.5, 2.0, 3.5, 2.0, 1.5],
                pegMultipliers: [{ row: 5, column: 0, multiplier: 1.5 }],
            };
            const mockKey = "key-456";
            mockVerify.mockReturnValue(true);
            mockAssignBoard.mockReturnValue({
                key: mockKey,
                board: mockBoard,
            });

            // Act
            await socketRouter.getLightningConfig(mockPayload);

            // Assert
            expect(mockVerify).toHaveBeenCalled();
            expect(mockAssignBoard).toHaveBeenCalledWith("TestPlayer", "test-key-123");
            expect(mockSocketClient.emit).toHaveBeenCalledWith("plinko", {
                lightningConfig: {
                    lightningKey: mockKey,
                    lightningBoard: mockBoard,
                },
            });
            expect(mockLogService.logError).not.toHaveBeenCalled();
        });

        it("should handle error during lightning board assignment and log it", async () => {
            // Arrange
            const mockError = new Error("Lightning board assignment failed");
            mockVerify.mockReturnValue(true);
            mockAssignBoard.mockImplementation(() => {
                throw mockError;
            });

            // Act
            await socketRouter.getLightningConfig(mockPayload);

            // Assert
            expect(mockVerify).toHaveBeenCalled();
            expect(mockAssignBoard).toHaveBeenCalled();
            expect(mockSocketClient.emit).not.toHaveBeenCalled();
            expect(mockLogService.logError).toHaveBeenCalledWith(mockError);
        });
    });
});
