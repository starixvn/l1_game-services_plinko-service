import { SettleGameRoundConsumer as BaseSettleGameRoundConsumer } from "sc-game-base/src/core/event-consumers";
import RoundResultConsumer from "./round-result-consumer";
import { LightningBoard, PlaceBetPayload, PlinkoOdds, PlinkoRound, SettlementResult } from "../types";

export default class SettleGameRoundConsumer extends BaseSettleGameRoundConsumer {
    roundResultConsumer: RoundResultConsumer;

    constructor(props: any) {
        super(props);
        this.roundResultConsumer = props.roundResultConsumer;
    }

    async settle(player: any, roundId: number, payload: PlaceBetPayload) {
        const playerName = player.profile.name;
        const { numberOfRows, gameMode } = payload;
        const { result, settlementResult, odds, board } = await this.roundResultConsumer.generateRoundData(playerName, roundId, payload);
        const newRound = await this.createNewRoundDocument(player, { roundId, result, settlementResult, odds, board }, payload);

        if (newRound) {
            await this.settleBet(newRound);
            return {
                roundId: newRound.id,
                result,
                settlementResult,
                winAmount: +newRound.betWin,
                amount: +newRound.amount,
                reachMaxWin: newRound.reachMaxWin,
                time: newRound.time,
                gameMode,
                numberOfRows,
                odds,
            };
        }
        return null;
    }

    getMaxWinPerRound(player: any) {
        const { maxWinPerRound } = this.gameData.gameConfigs;
        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === player.session.currencyGroupId);
        const maxBet = Math.min(player.profile?.maxBet ?? 0, settings?.maxBet ?? 0);

        return maxWinPerRound * maxBet;
    }

    async createNewRoundDocument(
        player: any,
        {
            roundId,
            result,
            settlementResult,
            odds,
            board,
        }: {
            roundId: number;
            result: number[];
            settlementResult: SettlementResult;
            odds: PlinkoOdds;
            board: LightningBoard | null;
        },
        payload: PlaceBetPayload
    ) {
        const { numberOfRows, gameMode, amount, clientSeed, lightningKey } = payload;
        const { exchangeRates } = this.gameData;
        const maxWinPerRound = this.getMaxWinPerRound(player);
        const actualWin = amount * settlementResult.multiplier;
        const betWin = parseFloat(Math.min(actualWin, maxWinPerRound).toFixed(2));
        const rate = player.session.multiplier * exchangeRates.code[player.session.currencyCode];

        const newRound: PlinkoRound = {
            id: roundId,
            uid: player.UID,
            name: player.profile.name,
            amount,
            totalAmount: amount,
            betWin,
            reachMaxWin: betWin === maxWinPerRound,
            paid: true,
            rate,
            odds,
            time: new Date(),
            clientSeed,
            currency: player.session.currencyName,
            siteId: player.session.siteId,
            siteName: player.session.siteName,
            playerId: player.session.playerId,
            operatorId: player.session.operatorId,
            appType: player.session.system,
            gameMode,
            numberOfRows,
            lightningKey,
            lightningBoard: board,
            result,
            settlementResult,
            exchangeRateId: exchangeRates.exId,
        };
        return this.roundsRepository.create(newRound);
    }

    async settleBet(round: PlinkoRound) {
        const betResult = this.calculateBetResult(round);
        await this.callEndGame(round, round.id, round.time, betResult, {});
    }

    calculateBetResult(round: PlinkoRound) {
        return {
            totalBetAmount: round.amount,
            totalWin: round.betWin,
            netWin: round.betWin - round.amount,
            totalLost: 0,
            winningByChoices: {},
        };
    }
}
