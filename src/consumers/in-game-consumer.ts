import { InGameConsumer as BaseInGameConsumer } from "sc-game-base/src/core/event-consumers";
import RoundQuery from "../query-apis/round-query";
import { GameConfigs } from "../types";

export default class InGameConsumer extends BaseInGameConsumer {
    declare roundQuery: RoundQuery;

    async consume(realPlayer: any) {
        const { gameConfigs, umMessages } = this.gameData;
        const disabled = !gameConfigs || !gameConfigs.enabled;
        if (disabled) {
            realPlayer.socketClient.emit(this.definition.name, { um: disabled, um_message: umMessages });
        }
        const payload = await this.buildPayload(realPlayer);
        realPlayer.socketClient.emit(this.definition.name, payload);
    }

    async buildPayload(realPlayer: any): Promise<any> {
        const user = await this.getUserInfo(realPlayer);
        const roundHistory = await this.roundQuery.getListByPlayerId(realPlayer.UID, this.definition.numberOfRoundHistory);
        const { exchangeRates } = this.gameData;
        const { session } = realPlayer;
        const rate = exchangeRates.code[session.currencyCode] * session.multiplier;
        const gameConfigs = this.getGameConfigs(realPlayer);

        return {
            gameConfigs,
            roundHistory,
            user: { ...user, rate },
        };
    }

    getGameConfigs(realPlayer: any) {
        const plinkoConfig = (this.gameData.gameConfigs as unknown as GameConfigs)?.plinkoConfig;
        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId?.toString() === realPlayer.session?.currencyGroupId);
        return { ...settings, ...plinkoConfig };
    }
}
