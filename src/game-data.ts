import BaseGameData from "sc-game-base/src/core/game-data";

export type PlayerResultBoard = {
    name: string;
    amount: number;
    winAmount: number;
    multiplier: number;
};

export default class GameData extends BaseGameData {
    betList: PlayerResultBoard[] = [];
    playerResultBoard: PlayerResultBoard[] = [];

    insertBetList(name: string, amount: number, winAmount: number, multiplier: number, rate = 1) {
        this.betList.push({ name, amount: amount * rate, winAmount: winAmount * rate, multiplier });
    }
}
