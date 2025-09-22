import { Core } from "sc-game-base";
import { initAPIStub, stubUserService, subGameManagementService } from "sc-game-service-integration-utils";

import appConfigs from "../../../build//app-configs.IGT";
import gameSettings from "../../../build/game-settings";
import { generateResult, getSettlementResult } from "../../../build/helpers/result-helper";
import ContainerRegistry from "../../../build/container-registry";

export const run = async () => {
    initAPIStub(appConfigs.apiSettings.apiUrl);
    stubUserService(appConfigs);
    const definition = new Core.GameDefinition(gameSettings, generateResult, getSettlementResult, () => {});
    subGameManagementService(appConfigs, definition);

    const gameData = new Core.GameData(gameSettings.durations.wholeRound);
    const container = new ContainerRegistry().register(appConfigs, definition, gameData);
    const app = new Core.BaseGameApp("Plinko", appConfigs);
    await app.run();
    await app.startGame(container);
};

run();
