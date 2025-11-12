import { GameStatusPublisher as BaseGameStatusPublisher } from "sc-game-base/src/core/event-publishers";
import { GameConfigs } from "../types";

export default class GameStatusPublisher extends BaseGameStatusPublisher {
    publishEnablingGameStatus() {
        const { gameConfigs } = this.gameData;
        const plinkoConfig = (gameConfigs as unknown as GameConfigs)?.plinkoConfig;

        Object.values(this.gameData.realPlayers).forEach((realPlayer: any) => {
            const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === realPlayer.session.currencyGroupId);
            const payload = { gameConfigs: { ...settings, ...plinkoConfig }, snr: true };
            realPlayer.socketClient && realPlayer.socketClient.emit(this.gameName, payload);
        });
    }
}
