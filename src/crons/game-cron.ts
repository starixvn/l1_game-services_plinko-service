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
        const isEnabled = !this.gameData.disabled;
        if (isEnabled && this.gameData.remainingTime === wholeRound) {
            await this.bot.reset();
        }
        if (isEnabled) {
            this.gameData.remainingTime--;
            await this.bot.run();
        }
        if (this.gameData.remainingTime < 0) {
            this.gameData.remainingTime = wholeRound;
        }
    }
}
