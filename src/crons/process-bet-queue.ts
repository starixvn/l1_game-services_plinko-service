import { ProcessBetQueue as BaseProcessBetQueue } from "sc-game-base/src/core/crons";
import SettleGameRoundConsumer from "../consumers/settle-game-round-consumer";
import { PlaceBetPayload } from "../types";
import { getChoiceId } from "../helpers/choice-mapper-helper";
import GameData from "../game-data";
import { generateServerSeedAndHash } from "../helpers/pf-helper";

export default class ProcessBetQueue extends BaseProcessBetQueue {
    declare settleGameRoundConsumer: SettleGameRoundConsumer;
    declare gameData: GameData;
    declare executeInterceptorEvent: (event: string, interceptors: any, context: any) => Promise<void>;

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

    async validateBetRequest(_: unknown, __: unknown) {
        return true;
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

    // @ts-ignore
    async handleSuccessBet(player: any, response: any, roundId: number, payload: PlaceBetPayload, applicableInterceptors: any) {
        const rate = this.calculateCurrencyRate(player.session);
        const placingBetResult = this.generatePlacingBetResult(player, response, payload, rate);
        const finish = await this.settleGameRoundConsumer.settle(player, roundId, rate);
        if (applicableInterceptors) {
            await this.executeInterceptorEvent("afterSuccessEvent", applicableInterceptors, {
                player,
                bet: payload,
                balance: response,
                betTime: finish?.time,
            });
        }
        this.placeBetPublisher.publishToUser(player.UID, { ...placingBetResult, finish });
        this.gameData.insertBetList(
            player.profile.name,
            finish?.amount ?? 0,
            finish?.winAmount ?? 0,
            finish?.settlementResult?.multiplier ?? 1,
            rate
        );
        this.publishNewPfToPlayer(player);
        if (player.profile.minBet !== response?.minBet || player.profile.maxBet !== response?.maxBet) {
            this.updateUserStakeLevel(player, response?.minBet, response?.maxBet);
        }
    }

    publishNewPfToPlayer(player: any) {
        const { serverSeedHash, serverSeed } = generateServerSeedAndHash(this.gameData.gameConfigs.randomMode);
        this.gameData.playerPf[player.profile.name] = { serverSeedHash, serverSeed };
        this.placeBetPublisher.publishToUser(player.UID, { pf: { serverSeedHash } });
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
