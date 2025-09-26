import { helpers } from "sc-common";
import { BaseBot } from "sc-game-base/src/core/crons";
import { GameConfigs } from "../types";
import { GAME_MODE, NUMBER_OF_ROWS } from "../constants";
import GameData from "../game-data";

export default class Bot extends BaseBot {
    declare gameData: GameData;

    isDuringBetTime() {
        return true;
    }

    async placeBet(bot: any): Promise<void> {
        const maxBet = this.getMaxBet(bot, "");
        const minBet = this.getMinBet();
        const amount = helpers.numberHelper.getRandomNumberStep5(minBet, maxBet, true);
        const multiplier = this.getMultiplier();
        const betWin = amount * multiplier;
        this.insertPlayerResultBoard(bot, amount, betWin, multiplier);
    }

    insertPlayerResultBoard(bot: any, amount: number, betWin: number, multiplier: number) {
        this.gameData.playerResultBoard.push({
            playerName: bot.name,
            amount,
            winAmount: betWin,
            multiplier,
        });
    }

    getMultiplier(gameMode = GAME_MODE.MEDIUM, numberOfRows = NUMBER_OF_ROWS.max): number {
        const slotIndex = Array.from({ length: numberOfRows }, () => (Math.random() < 0.5 ? 0 : 1)).filter((e) => e === 1).length; // NOSONAR
        const { plinkoConfig } = this.gameData.gameConfigs as unknown as GameConfigs;
        return plinkoConfig?.odds?.[gameMode]?.[numberOfRows]?.[slotIndex] ?? 1;
    }

    getMinBet() {
        return Math.max(1, this.gameData.gameConfigs.bot_minbet ?? 1);
    }

    getMaxBet(_: unknown, __: unknown): number {
        return this.gameData.gameConfigs.bot_maxbet ?? 1;
    }
}
