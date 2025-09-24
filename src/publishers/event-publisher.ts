import { BaseEventPublisher } from "sc-game-base/src/core/event-publishers";
import { maskName } from "../helpers/mask-name-helper";
import Chance from "chance";
import GameData from "../game-data";

export default class EventPublisher extends BaseEventPublisher {
    declare gameData: GameData;

    publishPlayerResultBoard() {
        if (!this.gameData.playerResultBoard?.length) {
            return;
        }
        const chance = new Chance();
        const { playerName, amount, winAmount } = chance.pickone(this.gameData.playerResultBoard);
        const playerBet = {
            playerName: maskName(playerName),
            amount,
            winAmount,
        };
        this.publishToAllUsers({ playerBet });
    }
}
