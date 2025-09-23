import { PlaceBetPublisher as BasePlaceBetPublisher } from "sc-game-base/src/core/event-publishers";
import { maskName } from "../helpers/mask-name-helper";

export default class PlaceBetPublisher extends BasePlaceBetPublisher {
    publishPlayerBetResult(playerName: string, amount: number, winAmount: number) {
        const playerBet = {
            playerName: maskName(playerName),
            amount,
            winAmount,
        };
        this.publishToAllUsers({ playerBet });
    }
}
