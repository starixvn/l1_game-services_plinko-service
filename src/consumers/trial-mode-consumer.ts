import { BaseEventPublisher } from "sc-game-base/src/core/event-publishers";
import { PlaceBetPayload } from "../types";
import RoundResultConsumer from "./round-result-consumer";

export default class TrialModeConsumer {
    roundResultConsumer: RoundResultConsumer;
    publisher: BaseEventPublisher;

    constructor(props: { roundResultConsumer: RoundResultConsumer; publisher: BaseEventPublisher }) {
        this.roundResultConsumer = props.roundResultConsumer;
        this.publisher = props.publisher;
    }

    async consume(player: any, payload: PlaceBetPayload) {
        const { numberOfRows, gameMode } = payload;
        const finish = await this.generateResult(player.profile.name, payload);
        this.publisher.publishToUser(player.UID, {
            endBet: 0,
            ownBets: { gameMode, numberOfRows },
            finish,
        });
    }

    async generateResult(playerName: string, payload: PlaceBetPayload) {
        const { numberOfRows, gameMode } = payload;
        const { result, settlementResult, odds } = await this.roundResultConsumer.generateRoundData(playerName, 0, payload);
        return {
            gameMode,
            numberOfRows,
            odds,
            result,
            settlementResult,
            winAmount: 0,
            amount: 0,
            reachMaxWin: false,
            time: new Date(),
        };
    }
}
