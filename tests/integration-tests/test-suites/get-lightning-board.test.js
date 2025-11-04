import { GameClientDriver, normalUser } from "sc-game-service-integration-utils";
import { initUserSession } from "../helper/helper";
import { socketOptionsFunc } from "../_stubs/test-data";
import appConfigs from "../../../build/app-configs.IGT";

const socketOptions = socketOptionsFunc(appConfigs.hostingPort);
const eventType = "getLightningConfig";
describe("get lightning config", () => {
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
    it("should receive lightning config", async () => {
        // Act
        client.emit(eventType, {});
        const { lightningConfig } = await client.handleGameEvent((data) => data.lightningConfig);

        // Assert
        expect(lightningConfig.lightningKey).toBeDefined();
        expect(typeof lightningConfig.lightningKey).toBe("string");
        expect(lightningConfig.lightningBoard.odds).toBeDefined();
        expect(lightningConfig.lightningBoard.odds.length).toBe(17);
        expect(lightningConfig.lightningBoard.pegMultipliers).toBeDefined();
        expect(lightningConfig.lightningBoard.pegMultipliers.length).toBeGreaterThanOrEqual(0);
    });

    it("should receive old lightning config when got config before", async () => {
        // Arrange
        client.emit(eventType, {});
        const { lightningConfig: oldLightningConfig } = await client.handleGameEvent((data) => data.lightningConfig);

        // Act
        client.emit(eventType, {});
        const { lightningConfig } = await client.handleGameEvent((data) => data.lightningConfig);

        // Assert
        expect(lightningConfig.lightningKey).toBe(oldLightningConfig.lightningKey);
        expect(lightningConfig.lightningBoard.odds).toEqual(oldLightningConfig.lightningBoard.odds);
        expect(lightningConfig.lightningBoard.pegMultipliers).toEqual(oldLightningConfig.lightningBoard.pegMultipliers);
    });

    it("should receive new lightning config", async () => {
        // Arrange
        client.emit(eventType, { lightningKey: "123" });
        const { lightningConfig: oldLightningConfig } = await client.handleGameEvent((data) => data.lightningConfig);

        // Act
        client.emit(eventType, { lightningKey: "321" });
        const { lightningConfig } = await client.handleGameEvent((data) => data.lightningConfig);

        // Assert
        expect(lightningConfig.lightningKey).toBe("321");
        expect(lightningConfig.lightningBoard.odds).not.toEqual(oldLightningConfig.lightningBoard.odds);
        expect(lightningConfig.lightningBoard.pegMultipliers).not.toEqual(oldLightningConfig.lightningBoard.pegMultipliers);
    });

    it("should receive same lightning config with same lightning key", async () => {
        // Arrange
        client.emit(eventType, { lightningKey: "123" });
        const { lightningConfig: oldLightningConfig } = await client.handleGameEvent((data) => data.lightningConfig);

        // Act
        client.emit(eventType, {});
        const { lightningConfig } = await client.handleGameEvent((data) => data.lightningConfig);

        // Assert
        expect(lightningConfig.lightningKey).toBe(oldLightningConfig.lightningKey);
        expect(lightningConfig.lightningBoard.odds).toEqual(oldLightningConfig.lightningBoard.odds);
        expect(lightningConfig.lightningBoard.pegMultipliers).toEqual(oldLightningConfig.lightningBoard.pegMultipliers);
    });
});
