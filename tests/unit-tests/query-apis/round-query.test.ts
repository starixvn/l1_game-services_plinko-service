import RoundQuery from "../../../src/query-apis/round-query";
import { PlinkoRound } from "../../../src/types";

describe("RoundQuery", () => {
    let roundQuery: RoundQuery;
    let mockRoundsRepository: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockRoundsRepository = {
            find: jest.fn(),
            lean: jest.fn(),
            exec: jest.fn(),
        };
        // Create instance
        // @ts-ignore
        roundQuery = new RoundQuery();
        roundQuery.roundsRepository = mockRoundsRepository;
    });

    describe("getListByPlayerId", () => {
        it("should retrieve and format rounds correctly", async () => {
            // Arrange
            const uid = "player123";
            const limit = 5;
            const mockRounds: PlinkoRound[] = [
                {
                    id: 1001,
                    result: [1, 0, 1, 0, 1, 1, 0, 0],
                    settlementResult: { slotIndex: 2, multiplier: 2.5 },
                    uid: "player123",
                    name: "player1",
                    amount: 100,
                    totalAmount: 100,
                    betWin: 250,
                    reachMaxWin: false,
                    paid: true,
                    rate: 1.0,
                    odds: { 1: { 8: [1.0, 2.0, 3.0] } },
                    time: new Date("2024-01-01T10:00:00Z"),
                    clientSeed: "seed1",
                    currency: "USD",
                    siteId: "site1",
                    playerId: "player1",
                    operatorId: "op1",
                    appType: 1,
                    gameMode: 1,
                    numberOfRows: 8,
                    freeBet: false,
                    exchangeRateId: 1,
                },
                {
                    id: 1002,
                    result: [0, 1, 0, 1, 0, 1, 1, 0],
                    settlementResult: { slotIndex: 5, multiplier: 1.0 },
                    uid: "player123",
                    name: "player1",
                    amount: 50,
                    totalAmount: 50,
                    betWin: 50,
                    reachMaxWin: false,
                    paid: true,
                    rate: 1.0,
                    odds: { 1: { 8: [1.0, 2.0, 3.0] } },
                    time: new Date("2024-01-01T10:05:00Z"),
                    clientSeed: "seed2",
                    currency: "USD",
                    siteId: "site1",
                    playerId: "player1",
                    operatorId: "op1",
                    appType: 1,
                    gameMode: 1,
                    numberOfRows: 8,
                    freeBet: false,
                    exchangeRateId: 1,
                },
            ];

            // Setup mock chain
            const mockExec = jest.fn().mockResolvedValue(mockRounds);
            const mockLean = jest.fn().mockReturnValue({ exec: mockExec });
            const mockFind = jest.fn().mockReturnValue({ lean: mockLean });

            mockRoundsRepository.find = mockFind;

            // Act
            const result = await roundQuery.getListByPlayerId(uid, limit);

            // Assert
            expect(mockRoundsRepository.find).toHaveBeenCalledWith({ uid }, { _id: false }, { sort: { id: -1 }, limit });
            expect(mockLean).toHaveBeenCalled();
            expect(mockExec).toHaveBeenCalled();
            expect(result).toEqual([
                {
                    roundId: 1001,
                    result: [1, 0, 1, 0, 1, 1, 0, 0],
                    settlementResult: { slotIndex: 2, multiplier: 2.5 },
                },
                {
                    roundId: 1002,
                    result: [0, 1, 0, 1, 0, 1, 1, 0],
                    settlementResult: { slotIndex: 5, multiplier: 1.0 },
                },
            ]);
        });
    });

    describe("queryHistory", () => {
        let mockCountDocuments: jest.Mock;
        let mockFind: jest.Mock;
        let mockLean: jest.Mock;
        let mockExec: jest.Mock;

        beforeEach(() => {
            mockCountDocuments = jest.fn().mockReturnValue({ exec: jest.fn() });
            mockExec = jest.fn();
            mockLean = jest.fn().mockReturnValue({ exec: mockExec });
            mockFind = jest.fn().mockReturnValue({ lean: mockLean });

            mockRoundsRepository.countDocuments = mockCountDocuments;
            mockRoundsRepository.find = mockFind;
        });

        it("should return empty object when page is less than 1", async () => {
            // Arrange
            const player = { UID: "player123" };
            const page = 0;
            const pageSize = 10;

            // Act
            const result = await roundQuery.queryHistory(player, page, pageSize);

            // Assert
            expect(result).toEqual({});
            expect(mockCountDocuments).not.toHaveBeenCalled();
            expect(mockFind).not.toHaveBeenCalled();
        });

        it("should return empty object when player is undefined", async () => {
            // Arrange
            const player = undefined;
            const page = 1;
            const pageSize = 10;

            // Act
            const result = await roundQuery.queryHistory(player, page, pageSize);

            // Assert
            expect(result).toEqual({});
            expect(mockCountDocuments).not.toHaveBeenCalled();
            expect(mockFind).not.toHaveBeenCalled();
        });

        it("should query history with correct parameters and return formatted result", async () => {
            // Arrange
            const player = { UID: "player123" };
            const page = 2;
            const pageSize = 5;
            const total = 25;
            const mockRounds = [
                {
                    _id: "round1",
                    amount: 100,
                    totalAmount: 100,
                    betWin: 250,
                    settlementResult: { slotIndex: 2, multiplier: 2.5 },
                    time: new Date("2024-01-01T10:00:00Z"),
                    clientSeed: "seed1",
                    gameMode: 1,
                    numberOfRows: 8,
                    freeBet: false,
                },
                {
                    _id: "round2",
                    amount: 50,
                    totalAmount: 50,
                    betWin: 50,
                    settlementResult: { slotIndex: 5, multiplier: 1.0 },
                    time: new Date("2024-01-01T10:05:00Z"),
                    clientSeed: "seed2",
                    gameMode: 1,
                    numberOfRows: 8,
                    freeBet: false,
                },
            ];

            mockCountDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(total) });
            mockExec.mockResolvedValue(mockRounds);

            // Act
            const result = await roundQuery.queryHistory(player, page, pageSize);

            // Assert
            expect(mockCountDocuments).toHaveBeenCalledWith({ uid: "player123", paid: true });
            expect(mockFind).toHaveBeenCalledWith({ uid: "player123", paid: true }, roundQuery.getRoundProjection(), {
                sort: { _id: -1 },
                skip: 5,
                limit: 5,
            });
            expect(mockLean).toHaveBeenCalled();
            expect(mockExec).toHaveBeenCalled();
            expect(result).toEqual({
                history: {
                    betLogs: mockRounds.map((round: any) => ({
                        roundId: round.id,
                        ...round,
                    })),
                    page: 2,
                    pageSize: 5,
                    total: 25,
                },
            });
        });

        it("should handle empty rounds array correctly", async () => {
            // Arrange
            const player = { UID: "player123" };
            const page = 1;
            const pageSize = 10;
            const total = 0;

            mockCountDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(total) });
            mockExec.mockResolvedValue([]);

            // Act
            const result = await roundQuery.queryHistory(player, page, pageSize);

            // Assert
            expect(result).toEqual({
                history: {
                    betLogs: [],
                    page: 1,
                    pageSize: 10,
                    total: 0,
                },
            });
        });
    });

    describe("getRoundProjection", () => {
        it("should return correct projection object", () => {
            // Act
            const projection = roundQuery.getRoundProjection();

            // Assert
            expect(projection).toEqual({
                _id: false,
                __v: false,
                __archive: false,
                uid: false,
                currency: false,
                rate: false,
                siteId: false,
                playerId: false,
                operatorId: false,
                paid: false,
                appType: false,
                exchangeRateId: false,
                result: false,
            });
        });
    });
});
