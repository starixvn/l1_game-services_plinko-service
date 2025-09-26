import { initUserSession } from "../helper/helper";
import { GameClientDriver, normalUser } from "sc-game-service-integration-utils";
import { socketOptionsFunc } from "../_stubs/test-data";
import appConfigs from "../../../build/app-configs.IGT";

const socketOptions = socketOptionsFunc(appConfigs.hostingPort);

describe("in game", () => {
    let client;

    beforeEach(async () => {
        client = new GameClientDriver(socketOptions, initUserSession(normalUser));
        const sendSignInInterval = setInterval(() => {
            client.sendSignInEvent();
        }, 500);

        await client.handleSignedInEvent();
        clearInterval(sendSignInInterval);
    });

    afterEach(() => {
        client.close();
        client = null;
    });

    it("should receive game configs response", async () => {
        // Arrange
        client.sendInGameEvent();

        // Act
        const { gameConfigs } = await client.handleGameEvent((data) => data.gameConfigs);

        // Assert
        expect(gameConfigs.gameId).toBe(145);
        expect(gameConfigs.odds).toEqual({
            0: {
                8: [1, 2, 3, 4, 5, 6, 7, 8, 9],
                9: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                11: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                12: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
                13: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
                14: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                15: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
                16: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
            },
            1: {
                8: [1, 2, 3, 4, 5, 6, 7, 8, 9],
                9: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                11: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                12: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
                13: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
                14: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                15: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
                16: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
            },
            2: {
                8: [1, 2, 3, 4, 5, 6, 7, 8, 9],
                9: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                11: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                12: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
                13: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
                14: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                15: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
                16: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
            },
        });
    });

    it("should receive user info", async () => {
        // Arrange
        client.sendInGameEvent();

        // Act
        const { user } = await client.handleGameEvent((data) => data.user);

        // Assert
        expect(user.name).toBe(normalUser.playerName);
        expect(user.rate).toBe(1);
    });

    it("should receive round history", async () => {
        // Arrange
        client.sendInGameEvent();

        // Act
        const { roundHistory } = await client.handleGameEvent((data) => data.roundHistory);

        // Assert
        expect(roundHistory.length).toBe(1);
        expect(roundHistory[0].roundId).toBe(1);
        expect(roundHistory[0].result).toEqual([1, 1, 0, 1, 1, 0, 0, 0]);
        expect(roundHistory[0].settlementResult).toEqual({ slotIndex: 4, multiplier: 5 });
    });

    it("should receive player result board", async () => {
        // Arrange
        client.sendInGameEvent();

        // Act
        const { playerResultBoard } = await client.handleGameEvent((data) => data.playerResultBoard);

        // Assert
        expect(typeof playerResultBoard).toEqual([]);
    });
});
