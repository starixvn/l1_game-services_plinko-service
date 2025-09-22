import { describe, expect } from "@jest/globals";
import { GameClientDriver, eventTypes, normalUser } from "sc-game-service-integration-utils";
import appConfigs from "../../../build/app-configs.IGT";
import gameSettings from "../_stubs/game-settings";
import { socketOptionsFunc } from "../_stubs/test-data";
import { getTimeOutToPlacingBetTime, initUserSession } from "../helper/helper";

const socketOptions = socketOptionsFunc(appConfigs.hostingPort);

describe("when place bet", () => {
    let client;

    beforeAll(async () => {
        client = new GameClientDriver(socketOptions, initUserSession(normalUser));

        const sendSignInInterval = setInterval(() => {
            client.sendSignInEvent();
        }, 500);

        await client.handleSignedInEvent();

        client.sendInGameEvent();
        clearInterval(sendSignInInterval);
        await client.handleGameEvent((inGameData) => inGameData.gameConfigs);
    });

    afterAll(() => {
        client.close();
        client = null;
    });

    describe("when place bet with valid data", () => {
        const payload = { amount: 100, gameMode: 0, numberOfRows: 8, clientSeed: "1234" };

        it("should return expected data", async () => {
            // Act
            client.emit(eventTypes.bet, payload);

            // Assert
            const data = await client.handleGameEvent((data) => data.endBet);
            const { endBet, ownBets, finish } = data;
            expect(endBet).toEqual(100);
            expect(ownBets).toEqual({ gameMode: 0, numberOfRows: 8 });

            expect(finish).toHaveProperty("result");
            expect(finish).toHaveProperty("settlementResult");
            expect(finish).toHaveProperty("betwin");
            expect(finish).toHaveProperty("amount");
            expect(finish.result.length).toEqual(payload.numberOfRows);
            expect(finish.result.every((path) => path === 0 || path === 1)).toBeTruthy();
            expect(finish.settlementResult.slotIndex).toBeGreaterThanOrEqual(0);
            expect(finish.settlementResult.slotIndex).toBeLessThanOrEqual(payload.numberOfRows);
            expect(typeof finish.settlementResult.multiplier).toBe("number");
            expect(finish.betwin).toBeGreaterThanOrEqual(0);
            expect(finish.amount).toBeGreaterThanOrEqual(0);
        });
    });
});
