import { describe, expect } from "@jest/globals";
import { GameClientDriver, eventTypes, normalUser } from "sc-game-service-integration-utils";
import appConfigs from "../../../build/app-configs.IGT";
import { socketOptionsFunc } from "../_stubs/test-data";
import { initUserSession } from "../helper/helper";

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
        it("should receive end bet", async () => {
            // Act
            client.emit(eventTypes.bet, payload);

            // Assert
            const { endBet } = await client.handleGameEvent((data) => data.endBet);
            expect(endBet).toEqual(100);
        });

        it("should receive own bets", async () => {
            // Act
            client.emit(eventTypes.bet, payload);

            // Assert
            const { ownBets } = await client.handleGameEvent((data) => data.ownBets);
            expect(ownBets).toEqual({ gameMode: 0, numberOfRows: 8 });
        });

        it("should receive finish", async () => {
            // Act
            client.emit(eventTypes.bet, payload);

            // Assert
            const { finish } = await client.handleGameEvent((data) => data.finish);
            expect(finish).toHaveProperty("result");
            expect(finish).toHaveProperty("settlementResult");
            expect(finish).toHaveProperty("winAmount");
            expect(finish).toHaveProperty("amount");
            expect(finish).toHaveProperty("reachMaxWin");
            expect(finish.result.length).toEqual(payload.numberOfRows);
            expect(finish.result.every((path) => path === 0 || path === 1)).toBeTruthy();
            expect(finish.settlementResult.slotIndex).toBeGreaterThanOrEqual(0);
            expect(finish.settlementResult.slotIndex).toBeLessThanOrEqual(payload.numberOfRows);
            expect(typeof finish.settlementResult.multiplier).toBe("number");
            expect(finish.winAmount).toBeGreaterThanOrEqual(0);
            expect(finish.amount).toBeGreaterThanOrEqual(0);
            expect(typeof finish.reachMaxWin).toBe("boolean");
        });

        it("should receive playerBet", async () => {
            // Act
            client.emit(eventTypes.bet, payload);

            // Assert
            const { playerBet } = await client.handleGameEvent((data) => data.playerBet);
            expect(playerBet.playerName).toEqual("N***ser"); // mask name NormalUser
            expect(playerBet.amount).toEqual(100);
            expect(playerBet.winAmount).toBeGreaterThanOrEqual(0);
        });
    });

    describe("when place bet with invalid data", () => {
        const testCases = [
            { payload: { gameMode: 0, numberOfRows: 8, clientSeed: "1234" }, expected: { errorCode: "SB1935" } },
            { payload: { amount: 100, numberOfRows: 8, clientSeed: "1234" }, expected: { errorCode: "SB1935" } },
            { payload: { amount: 100, gameMode: 0, clientSeed: "1234" }, expected: { errorCode: "SB1935" } },
            { payload: { amount: 100, gameMode: 0, numberOfRows: 8 }, expected: { errorCode: "SB1935" } },
            { payload: { amount: 100, gameMode: 4, clientSeed: "1234" }, expected: { errorCode: "SB1935" } },
            { payload: { amount: 100, gameMode: 0, numberOfRows: 5, clientSeed: "1234" }, expected: { errorCode: "SB1935" } },
        ];
        testCases.forEach(({ payload, expected }) => {
            it(`should receive error notice`, async () => {
                // Act
                client.emit(eventTypes.bet, payload);

                // Assert
                const { endBet, notice } = await client.handleGameEvent((data) => data.notice);
                expect(endBet).toEqual(-1);
                expect(notice).toEqual(expected);
            });
        });
    });
});
