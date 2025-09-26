import { ProcessBetQueue as BaseProcessBetQueue } from "sc-game-base/src/core/crons";
import SettleGameRoundConsumer from "../consumers/settle-game-round-consumer";
import { PlaceBetPayload, SettlementResult } from "../types";
import { getChoiceId } from "../helpers/choice-mapper-helper";
import GameData from "../game-data";

export default class ProcessBetQueue extends BaseProcessBetQueue {
    declare settleGameRoundConsumer: SettleGameRoundConsumer;
    declare gameData: GameData;

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

    async validateBetRequest(_: unknown, __: unknown) {
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
        this.insertPlayerResultBoard(player, finish);
    }

    insertPlayerResultBoard(player: any, finish: { amount: number; winAmount: number; settlementResult: SettlementResult } | null) {
        this.gameData.playerResultBoard.push({
            playerName: player.profile.name,
            amount: finish?.amount ?? 0,
            winAmount: finish?.winAmount ?? 0,
            multiplier: finish?.settlementResult?.multiplier ?? 1,
        });
    }

    generatePlacingBetResult(_: unknown, response: any, payload: PlaceBetPayload, __: unknown) {
        const { amount, gameMode, numberOfRows } = payload;
        return {
            endBet: amount,
            ownBets: { gameMode, numberOfRows },
            user: { ...response },
        } as any;
    }

    decreaseBetTracks(_: unknown, __: unknown): void {} // NOSONAR
}
