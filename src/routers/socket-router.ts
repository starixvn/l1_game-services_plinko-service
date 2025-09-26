import { BaseSocketRouter } from "sc-game-base/src/core/routers";
import RoundQuery from "../query-apis/round-query";

export default class SocketRouter extends BaseSocketRouter {
    declare roundQuery: RoundQuery;
    async handleGetHistory(payload: any) {
        try {
            if (!this.verify()) {
                return;
            }

            const history = await this.roundQuery.queryHistory(
                this.gameData.realPlayers[this.socketClient.id],
                payload.page,
                this.definition.historyPageSize
            );

            this.socketClient.emit(this.definition.name, history);
        } catch (error) {
            this.logService.logError(error);
        }
    }
}
