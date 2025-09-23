import { helpers } from "sc-common";
import { BaseBot } from "sc-game-base/src/core/crons";
import { GameConfigs } from "../types";
import { GAME_MODE, NUMBER_OF_ROWS } from "../constants";
import { Core } from "sc-game-base";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";
import PlaceBetPublisher from "../publishers/place-bet-publisher";

export default class Bot extends BaseBot {
    placeBetPublisher: PlaceBetPublisher;

    constructor(
        definition: Core.GameDefinition,
        gameData: Core.GameData,
        gameManagementApiClientFactory: GameManagementApiClientFactory,
        placeBetPublisher: PlaceBetPublisher
    ) {
        super(definition, gameData, gameManagementApiClientFactory);
        this.placeBetPublisher = placeBetPublisher;
    }

    isDuringBetTime = () => true;

    async placeBet(bot: any): Promise<void> {
        const maxBet = this.getMaxBet(bot, "");
        const minBet = this.getMinBet();
        const amount = helpers.numberHelper.getRandomNumberStep5(minBet, maxBet, true);
        const betWin = this.calculateBetWin(amount);
        this.placeBetPublisher.publishPlayerBetResult(bot.name, amount, betWin);
    }

    calculateBetWin(amount: number, gameMode = GAME_MODE.MEDIUM, numberOfRows = NUMBER_OF_ROWS.max): number {
        const slotIndex = Array.from({ length: numberOfRows }, () => (Math.random() < 0.5 ? 0 : 1)).filter((e) => e === 1).length;
        const { plinkoConfig } = this.gameData.gameConfigs as unknown as GameConfigs;
        return amount * (plinkoConfig?.odds?.[gameMode]?.[numberOfRows]?.[slotIndex] ?? 1);
    }

    getMaxBet(_: any, __: string): number {
        const gameConfigs = this.gameData.gameConfigs;
        return gameConfigs.bot_maxbet ?? 1;
    }
}
