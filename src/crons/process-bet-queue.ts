import { ProcessBetQueue as BaseProcessBetQueue } from "sc-game-base/src/core/crons";
import SettleGameRoundConsumer from "../consumers/settle-game-round-consumer";
import { PlaceBetPayload } from "../types";
import { getChoiceId } from "../helpers/choice-mapper";

export default class ProcessBetQueue extends BaseProcessBetQueue {
    declare settleGameRoundConsumer: SettleGameRoundConsumer;
    constructor(props: any) {
        super(props);
        this.settleGameRoundConsumer = props.settleGameRoundConsumer;
    }

    async proceedBet(player: any, payload: any) {
        this.gameData.roundId++;
        await super.proceedBet(player, payload);
        this.resetBetData(player);
    }

    resetBetData(player: any) {
        this.gameData.ingame[player.profile.name] && delete this.gameData.ingame[player.profile.name];
    }

    formatApiBetInfo(payload: PlaceBetPayload) {
        return {
            amount: payload.amount,
            gameId: this.definition.id,
            gameRoundId: this.gameData.roundId,
            choiceId: getChoiceId(payload.gameMode, payload.numberOfRows),
            freeBet: false,
            clientSentTime: payload.time ?? new Date(),
            metadata: {
                mode: `${payload.mode}`,
            },
        };
    }

    async validateBetRequest(_: any, __: any) {
        return true;
    }

    async handleSuccessBet(player: any, response: any, roundId: number, payload: PlaceBetPayload) {
        const rate = this.calculateCurrencyRate(player.session);
        if (player.profile.minBet !== response.minBet || player.profile.maxBet !== response.maxBet) {
            this.updateUserStakeLevel(player, response.minBet, response.maxBet);
        }
        const placingBetResult = this.generatePlacingBetResult(player, response, payload, rate);
        const finish = await this.settleGameRoundConsumer.settle(player, roundId, rate);
        this.placeBetPublisher.publishToUser(player.UID, { ...placingBetResult, finish });
    }

    generatePlacingBetResult(_: any, response: any, payload: PlaceBetPayload, __: any) {
        const { amount, gameMode, numberOfRows } = payload;
        return {
            endBet: amount,
            ownBets: { gameMode, numberOfRows },
            user: { ...response },
        } as any;
    }
}
