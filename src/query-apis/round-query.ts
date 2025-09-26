import { RoundQuery as BaseRoundQuery } from "sc-game-base/src/core/query-apis";
import { PlinkoRound } from "../types";

export default class RoundQuery extends BaseRoundQuery {
    async getListByPlayerId(uid: string, limit = 10) {
        const rounds = await this.roundsRepository
            .find({ uid }, { _id: false }, { sort: { id: -1 }, limit: limit })
            .lean()
            .exec();

        return rounds.map((round: PlinkoRound) => ({
            roundId: round.id,
            result: round.result,
            settlementResult: round.settlementResult,
        }));
    }

    async queryHistory(player: any, page: number, pageSize: number) {
        if (page < 1 || !player) {
            return {};
        }

        const filter = { uid: player.UID, paid: true };
        const numberOfSkippedBets = (page - 1) * pageSize;
        const total = await this.roundsRepository.countDocuments(filter).exec();

        const betProjection = this.getRoundProjection();

        const rounds = await this.roundsRepository
            .find(filter, betProjection, { sort: { _id: -1 }, skip: numberOfSkippedBets, limit: pageSize })
            .lean()
            .exec();
        const betLogs =
            rounds?.length > 0
                ? rounds.map((round: PlinkoRound) => ({
                      roundId: round.id,
                      ...round,
                  }))
                : [];

        return { history: { betLogs, page, pageSize, total } };
    }

    getRoundProjection() {
        return {
            _id: false,
            __v: false,
            __archive: false,
            uid: false,
            currency: false,
            rate: false,
            siteId: false,
            playerId: false,
            operatorId: false,
            paid: false,
            appType: false,
            exchangeRateId: false,
            result: false,
        };
    }
}
