import { BaseGameCron } from "sc-game-base/src/core/crons";
import EventPublisher from "../publishers/event-publisher";
import GameData from "../game-data";

export default class GameCron extends BaseGameCron {
    declare gameData: GameData;
    publisher: EventPublisher;

    constructor(props: any) {
        super(props);
        this.publisher = props.publisher;
    }

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
            this.publisher.publishPlayerResultBoard();
            this.resetPlayerResultBoard();
        }
        if (this.gameData.remainingTime < 0) {
            this.gameData.remainingTime = wholeRound;
        }
    }

    resetPlayerResultBoard() {
        this.gameData.playerResultBoard = [];
    }
}
