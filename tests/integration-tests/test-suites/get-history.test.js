import { GameClientDriver, normalUser, eventTypes } from "sc-game-service-integration-utils";
import { initUserSession } from "../helper/helper";
import { socketOptionsFunc } from "../_stubs/test-data";
import appConfigs from "../../../build/app-configs.IGT.js";

const socketOptions = socketOptionsFunc(appConfigs.hostingPort);

describe("when get history", () => {
    let driver;

    beforeAll(async () => {
        driver = new GameClientDriver(socketOptions, initUserSession(normalUser));

        const sendSignInInterval = setInterval(() => {
            driver.sendSignInEvent();
        }, 500);

        await driver.handleSignedInEvent();

        driver.sendInGameEvent();
        await driver.handleGameEvent((inGameData) => inGameData.gameConfigs);

        clearInterval(sendSignInInterval);
    });

    afterAll(() => {
        driver.close();
    });

    it("should receive seeded history with exact values", async () => {
        // Arrange
        driver.sendGetHistoryEvent();

        // Act
        const { history } = await driver.handleGameEvent((historyData) => historyData.history);

        // Assert
        const seededRoundBetLogs = history.betLogs.filter((betLog) => betLog.roundId === 1 && betLog.name === "NormalUser");
        expect(seededRoundBetLogs.length).toBeGreaterThanOrEqual(1);

        const actualBetLogs = seededRoundBetLogs.slice(0, 1).map((betLog) => {
            const { result, betLogDetails, time, id, totalAmount, ...rest } = betLog;
            return rest;
        });

        const expectedData = [
            {
                gameMode: 0,
                numberOfRows: 8,
                amount: 100,
                betWin: 500,
                reachMaxWin: false,
                name: "NormalUser",
                odds: {
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
                },
                roundId: 1,
                clientSeed: "1234",
                settlementResult: { slotIndex: 4, multiplier: 5 },
            },
        ];

        expect(actualBetLogs).toEqual(expectedData);
    }, 30000);
});
