import { helpers } from "sc-common";
import { PlaceBetConsumer as BasePlaceBetConsumer } from "sc-game-base/src/core/event-consumers";
import notices from "../constants/notices";
import { GAME_MODE, NUMBER_OF_ROWS } from "../constants";
import { PlaceBetPayload } from "../types";

export default class PlaceBetConsumer extends BasePlaceBetConsumer {
    composeValidationCriteria(player: any, betChoice: any, amount: number, freeBet: boolean, _: number) {
        const bettingTimeValidationCriteria = this.composeTimeValidationCriteria(player);
        const betAmountValidationCriteria = this.composeBetAmountValidationCriteria(player, betChoice, amount, freeBet);
        return bettingTimeValidationCriteria.concat(betAmountValidationCriteria);
    }

    composeTimeValidationCriteria(player: any) {
        const configs = this.gameData.gameConfigs;
        const { hasBet } = this.gameData.ingame[player.profile.name] || { hasBet: false };

        return [
            {
                failure: !configs.enabled,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
            {
                failure: hasBet,
                notice: this.getNoticeObj(notices.processingAction),
            },
        ];
    }

    composeBetAmountValidationCriteria(player: any, _: any, totalAmount: number, __: boolean) {
        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === player.session.currencyGroupId);
        const minBet = Math.max(player.profile.minBet, settings?.minBet ?? 0);
        const maxBet = Math.min(player.profile.maxBet, settings?.maxBet ?? 0);

        return [
            {
                failure: totalAmount < minBet,
                notice: this.getNoticeObj(helpers.noticeHelper.minBet, { minBet }),
            },
            {
                failure: totalAmount > maxBet,
                notice: this.getNoticeObj(helpers.noticeHelper.maxBet, { maxBet }),
            },
        ];
    }

    validateBetRequestParams(request: PlaceBetPayload) {
        const { amount, numberOfRows, gameMode } = request;
        const isValidNumberOfRows = numberOfRows >= NUMBER_OF_ROWS.min && numberOfRows <= NUMBER_OF_ROWS.max;
        const isValidGameMode = Object.values(GAME_MODE).includes(gameMode);

        return [
            {
                failure: !amount || !isValidNumberOfRows || !isValidGameMode,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
        ];
    }

    consume(player: any, payload: PlaceBetPayload) {
        Object.assign(payload, {
            freeBet: payload.freeBet ?? false,
            receivedTime: payload.receivedTime ?? new Date(),
            mode: payload.m ?? this.DisplayMode.Landscape,
        });

        const { amount, numberOfRows, gameMode } = payload;

        if (!this.validateRequestParams(payload, player)) {
            return;
        }

        if (!this.validateBetRequest(player, "", amount, false, 0)) {
            return;
        }

        const name = player.profile.name;
        if (!this.gameData.ingame[name]) {
            this.gameData.ingame[name] = {
                name: player.profile.name,
                currency: player.session.currencyName,
                system: player.session.system,
                betTracks: {},
                betProcessing: false,
                betQueue: [{ player, payload }],
                operatorId: player.session.operatorId,
                numberOfRows,
                gameMode,
                amount,
                clientSeed: payload.clientSeed,
                hasBet: true,
            };
        }
    }
}
