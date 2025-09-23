import { GameClientDriver, normalUser } from "sc-game-service-integration-utils";
import { initUserSession } from "../helper/helper";
import { socketOptionsFunc } from "../_stubs/test-data";
import appConfigs from "../../../build/app-configs.IGT";

const socketOptions = socketOptionsFunc(appConfigs.hostingPort);

describe("when getRoundPF", () => {
    let client;

    beforeEach(async () => {
        client = new GameClientDriver(socketOptions, initUserSession(normalUser));

        const sendSignInInterval = setInterval(() => {
            client.sendSignInEvent();
        }, 500);

        await client.handleSignedInEvent();

        client.sendInGameEvent();

        clearInterval(sendSignInInterval);
    });

    afterEach(() => {
        client.close();
        client = null;
    });

    it("should receive pfInfo", async () => {
        // Arrange
        client.emit("getRoundPF", { roundId: 1 });
        const pfInfo = {
            roundId: 1,
            serverSeedHash: "c1c4857aa423eaff150fc6e765cf49241b8766090baf597143637a4f28dd6477",
            serverSeed: "ww4G8G]ofL8VsAA(4!&vIEZ(l%l[sD9$fZnR@^0K",
            finalHash: "1377588d03c484407b9904d7935d52d04c9bb8c14766bca6200774ee3ce583f0",
            mergeSeed: "ww4G8G]ofL8VsAA(4!&vIEZ(l%l[sD9$fZnR@^0K1234",
            mergeClientSeed: "1234",
        };

        // Act
        const { roundPFResult } = await client.handleGameEvent((data) => data.roundPFResult);

        // Assert
        expect(roundPFResult.roundId).toEqual(pfInfo.roundId);
        expect(roundPFResult.serverSeedHash).toEqual(pfInfo.serverSeedHash);
        expect(roundPFResult.serverSeed).toEqual(pfInfo.serverSeed);
        expect(roundPFResult.finalHash).toEqual(pfInfo.finalHash);
        expect(roundPFResult.mergeSeed).toEqual(pfInfo.mergeSeed);
        expect(roundPFResult.mergeClientSeed).toEqual(pfInfo.mergeClientSeed);
    });
});
