import { BaseGameCron } from "sc-game-base/src/core/crons";

export default class GameCron extends BaseGameCron {
    async start() {
        await this.roundIdConsumer.initRoundId();
        await this.getSettingForNewRound();
        await this.updateExchangeRates();
        this.startCron();
    }

    async proceed() {
        const { wholeRound } = this.definition.durations;
        if (this.gameData.remainingTime === wholeRound) {
            await this.checkGameStatus();
        }

        if (!this.gameData.disabled) {
            this.gameData.remainingTime--;
        }
        if (this.gameData.remainingTime < 0) {
            this.gameData.remainingTime = wholeRound;
        }
    }
}
