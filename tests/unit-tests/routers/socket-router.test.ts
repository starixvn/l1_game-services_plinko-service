import SocketRouter from "../../../src/routers/socket-router";
import RoundQuery from "../../../src/query-apis/round-query";

describe("SocketRouter", () => {
    let socketRouter: SocketRouter;
    let mockRoundQuery: jest.Mocked<RoundQuery>;
    let mockVerify: jest.Mock;
    let mockGameData: any;
    let mockSocketClient: any;
    let mockDefinition: any;
    let mockLogService: any;

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

        // Create instance and inject mocks
        // @ts-ignore
        socketRouter = new SocketRouter({});
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

        it("should handle missing player data gracefully", async () => {
            // Arrange
            mockVerify.mockReturnValue(true);
            mockRoundQuery.queryHistory.mockResolvedValue({ history: { betLogs: [] } } as any);

            // Simulate missing player data
            socketRouter.gameData.realPlayers = {};

            // Act
            await socketRouter.handleGetHistory(mockPayload);

            // Assert
            expect(mockRoundQuery.queryHistory).toHaveBeenCalledWith(
                undefined, // player will be undefined
                2,
                20
            );
            expect(mockSocketClient.emit).toHaveBeenCalled();
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
});
