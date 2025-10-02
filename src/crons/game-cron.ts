import { Crons, BaseEventPublishers } from "sc-game-base/src/core";
import GameData from "../game-data";
import Chance from "chance";
import { maskName } from "../helpers/mask-name-helper";
import { NUMBER_OF_PLAYER_RESULT_BOARD } from "../constants";

export default class GameCron extends Crons.BaseGameCron {
    declare gameData: GameData;
    publisher: BaseEventPublishers.BaseEventPublisher;

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
            this.publishPlayerBet();
            this.resetBetList();
        }
        if (this.gameData.remainingTime < 0) {
            this.gameData.remainingTime = wholeRound;
        }
    }

    publishPlayerBet() {
        if (!this.gameData.betList?.length) {
            return;
        }
        const chance = new Chance();
        const { name, betAmount, winAmount, multiplier } = chance.pickone(this.gameData.betList);
        const playerBet = {
            name: maskName(name),
            betAmount,
            winAmount,
            multiplier,
        };
        this.gameData.playerResultBoard.unshift(playerBet);
        this.gameData.playerResultBoard.length > NUMBER_OF_PLAYER_RESULT_BOARD && this.gameData.playerResultBoard.pop();
        this.publisher.publishToAllUsers({ playerBet });
    }

    resetBetList() {
        this.gameData.betList = [];
    }
}
