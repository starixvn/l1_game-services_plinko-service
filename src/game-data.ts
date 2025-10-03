import BaseGameData from "sc-game-base/src/core/game-data";

export type PlayerResultBoard = {
    name: string;
    betAmount: number;
    winAmount: number;
    multiplier: number;
};

export type PlayerPf = {
    [playerName: string]: {
        serverSeedHash?: string;
        serverSeed?: string;
    };
};

export default class GameData extends BaseGameData {
    betList: PlayerResultBoard[] = [];
    playerResultBoard: PlayerResultBoard[] = [];
    playerPf: PlayerPf = {};

    insertBetList(name: string, amount: number, winAmount: number, multiplier: number, rate = 1) {
        this.betList.push({ name, betAmount: amount * rate, winAmount: winAmount * rate, multiplier });
    }
}
