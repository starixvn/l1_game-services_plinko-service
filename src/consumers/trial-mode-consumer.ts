import { GameDefinition, Helpers, BaseEventPublishers } from "sc-game-base/src/core";
import GameData from "../game-data";
import { GameConfigs, SettlementResult } from "../types";

export default class TrialModeConsumer {
    definition: GameDefinition;
    gameData: GameData;
    publisher: BaseEventPublishers.BaseEventPublisher;

    constructor({
        definition,
        gameData,
        publisher,
    }: {
        definition: GameDefinition;
        gameData: GameData;
        publisher: BaseEventPublishers.BaseEventPublisher;
    }) {
        this.definition = definition;
        this.gameData = gameData;
        this.publisher = publisher;
    }

    consume(player: any) {
        const playerName = player.profile.name;
        const { numberOfRows, gameMode } = this.gameData.ingame[playerName];
        const finish = this.generateResult(playerName);
        this.publisher.publishToUser(player.UID, {
            endBet: 0,
            ownBets: { gameMode, numberOfRows },
            finish,
        });
    }

    generateResult(playerName: string) {
        const { plinkoConfig, randomMode } = this.gameData.gameConfigs as unknown as GameConfigs;
        const { numberOfRows, gameMode } = this.gameData.ingame[playerName];
        const serverSeed = Helpers.ServerSeedHelper.generateServerSeed(randomMode);
        const result = this.definition.generateResult(Helpers.SeedHelper.getSHA512Hash(serverSeed)).slice(0, numberOfRows);
        const slotIndex = this.definition.settle(result) as number;
        const settlementResult: SettlementResult = {
            slotIndex,
            multiplier: +(plinkoConfig?.odds?.[gameMode]?.[numberOfRows]?.[slotIndex] ?? 1),
        };

        return {
            gameMode,
            numberOfRows,
            odds: plinkoConfig.odds,
            result,
            settlementResult,
            winAmount: 0,
            amount: 0,
            reachMaxWin: false,
            time: new Date(),
        };
    }
}
