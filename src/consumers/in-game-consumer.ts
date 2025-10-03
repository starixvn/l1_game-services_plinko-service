import { InGameConsumer as BaseInGameConsumer } from "sc-game-base/src/core/event-consumers";
import RoundQuery from "../query-apis/round-query";
import { GameConfigs } from "../types";
import GameData from "../game-data";
import { generateServerSeedAndHash } from "../helpers/pf-helper";

export default class InGameConsumer extends BaseInGameConsumer {
    declare gameData: GameData;
    declare roundQuery: RoundQuery;
    declare trackUserSignIn: (realPlayer: any, user: any) => Promise<void>;

    async consume(realPlayer: any) {
        const { gameConfigs, umMessages } = this.gameData;
        const disabled = !gameConfigs || !gameConfigs.enabled;
        if (disabled) {
            realPlayer.socketClient.emit(this.definition.name, { um: disabled, um_message: umMessages });
        }
        const payload = await this.buildPayload(realPlayer);
        realPlayer.socketClient.emit(this.definition.name, payload);
        await this.trackUserSignIn(realPlayer, payload.user);
    }

    async buildPayload(realPlayer: any): Promise<any> {
        const user = await this.getUserInfo(realPlayer);
        const roundHistory = await this.roundQuery.getListByPlayerId(realPlayer.UID, this.definition.numberOfRoundHistory);
        const { exchangeRates, playerResultBoard: players, gameConfigs: configs } = this.gameData;
        const { session } = realPlayer;
        const rate = exchangeRates.code[session.currencyCode] * session.multiplier;
        const gameConfigs = this.getGameConfigs(realPlayer);
        const { serverSeedHash, serverSeed } = generateServerSeedAndHash(configs?.randomMode);
        this.gameData.playerPf[realPlayer.profile.name] = { serverSeedHash, serverSeed };

        return {
            gameConfigs,
            roundHistory,
            playerResultBoard: { players },
            pf: { serverSeedHash },
            user: { ...user, rate },
        };
    }

    getGameConfigs(realPlayer: any) {
        const plinkoConfig = (this.gameData.gameConfigs as unknown as GameConfigs)?.plinkoConfig;
        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId?.toString() === realPlayer.session?.currencyGroupId);
        return { ...settings, ...plinkoConfig };
    }
}
