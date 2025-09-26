import BaseGameData from "sc-game-base/src/core/game-data";

export type PlayerResultBoard = {
    playerName: string;
    amount: number;
    winAmount: number;
    multiplier: number;
};

export default class GameData extends BaseGameData {
    playerBetList: PlayerResultBoard[] = [];
    playerResultBoard: PlayerResultBoard[] = [];
}
