import { SettleGameRoundConsumer as BaseSettleGameRoundConsumer } from "sc-game-base/src/core/event-consumers";
import RoundResultConsumer from "./round-result-consumer";
import { GameConfigs, PlinkoRound, SettlementResult } from "../types";

export default class SettleGameRoundConsumer extends BaseSettleGameRoundConsumer {
    roundResultConsumer: RoundResultConsumer;
    constructor(props: any) {
        super(props);
        this.roundResultConsumer = props.roundResultConsumer;
    }

    async settle(player: any, roundId: number, rate: number) {
        const playerName = player.profile.name;
        const { numberOfRows, gameMode } = this.gameData.ingame[player.profile.name];
        const { plinkoConfig } = this.gameData.gameConfigs as unknown as GameConfigs;

        const result = (await this.roundResultConsumer.generateResultByBet(playerName, roundId)).slice(0, numberOfRows);
        const slotIndex = this.definition.settle(result) as number;
        const settlementResult: SettlementResult = {
            slotIndex,
            multiplier: plinkoConfig?.odds?.[gameMode]?.[numberOfRows]?.[slotIndex] ?? 1,
        };

        const newRound = await this.createNewRoundDocument(player, rate, roundId, result, settlementResult);

        if (newRound) {
            await this.settleBet(newRound);
            return { result, settlementResult, winAmount: +newRound.betWin, amount: +newRound.amount, reachMaxWin: newRound.reachMaxWin };
        }
        return null;
    }

    getMaxWinPerRound(player: any) {
        const { maxWinPerRound } = this.gameData.gameConfigs;
        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === player.session.currencyGroupId);
        const maxBet = Math.min(player.profile?.maxBet ?? 0, settings?.maxBet ?? 0);

        return maxWinPerRound * maxBet;
    }

    async createNewRoundDocument(player: any, rate: number, roundId: number, result: number[], settlementResult: SettlementResult) {
        const { numberOfRows, gameMode, amount, clientSeed } = this.gameData.ingame[player.profile.name];
        const { plinkoConfig } = this.gameData.gameConfigs as unknown as GameConfigs;
        const { exchangeRates } = this.gameData;
        const maxWinPerRound = this.getMaxWinPerRound(player);
        const actualWin = amount * settlementResult.multiplier;
        const betWin = Math.min(actualWin, maxWinPerRound);

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
            odds: plinkoConfig.odds,
            time: new Date(),
            clientSeed,
            currency: player.session.currencyName,
            siteId: player.session.siteId,
            playerId: player.session.playerId,
            operatorId: player.session.operatorId,
            appType: player.session.system,
            gameMode,
            numberOfRows,
            result,
            settlementResult,
            freeBet: false,
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
