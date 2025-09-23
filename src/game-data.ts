import BaseGameData from "sc-game-base/src/core/game-data";

export default class GameData extends BaseGameData {
    playerResultBoard: { playerName: string; amount: number; winAmount: number }[] = [];
}
