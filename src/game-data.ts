import BaseGameData from "sc-game-base/src/core/game-data";
import appConfigs from "./app-configs";

export type PlayerResultBoard = {
    playerName: string;
    amount: number;
    winAmount: number;
    multiplier: number;
};

export default class GameData extends BaseGameData {
    playerBetList: PlayerResultBoard[] = [];
    playerResultBoard: PlayerResultBoard[] = [];

    constructor(duration: number) {
        super(duration);
        // Initialize with hardcoded game config for local testing
        this.gameConfigs = appConfigs.hardcodedGameConfig as any;
    }
}
