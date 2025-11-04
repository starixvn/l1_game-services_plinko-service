import { BaseSocketRouter } from "sc-game-base/src/core/routers";
import RoundQuery from "../query-apis/round-query";
import { GameConfigs } from "../types";
import { LightningBoardAssigner } from "../lightning-feature/lightning-board-assigner";

export default class SocketRouter extends BaseSocketRouter {
    lightningBoardAssigner: LightningBoardAssigner;
    declare roundQuery: RoundQuery;

    constructor(props: any) {
        super(props);
        this.lightningBoardAssigner = props.lightningBoardAssigner;
    }

    init(socketClient: any) {
        super.init(socketClient);
        this.socketClient.on("getLightningConfig", this.getLightningConfig.bind(this));
    }

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

    async getLightningConfig(payload: { lightningKey?: string }) {
        try {
            if (!this.verify()) {
                return;
            }
            const plinkoConfig = (this.gameData.gameConfigs as unknown as GameConfigs)?.plinkoConfig;
            if (!plinkoConfig?.enabledLightningMode) {
                return;
            }
            const player = this.gameData.realPlayers[this.socketClient.id];
            const { key, board } = this.lightningBoardAssigner.assignBoard(player.profile.name, payload?.lightningKey);
            this.socketClient.emit(this.definition.name, { lightningConfig: { lightningKey: key, lightningBoard: board } });
        } catch (error) {
            this.logService.logError(error);
        }
    }
}
