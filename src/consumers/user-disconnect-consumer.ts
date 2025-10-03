import { UserDisconnectConsumer as BaseUserDisconnectConsumer } from "sc-game-base/src/core/event-consumers";
import GameData from "../game-data";
export default class UserDisconnectConsumer extends BaseUserDisconnectConsumer {
    declare gameData: GameData;

    async consume(socketClient: any) {
        const userData = this.gameData.realPlayers[socketClient.id];
        userData?.profile?.name && delete this.gameData.playerPf[userData.profile.name];
        super.consume(socketClient);
    }
}
