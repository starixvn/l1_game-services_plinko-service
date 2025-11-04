import { RoundResultConsumer as BaseRoundResultConsumer } from "sc-game-base/src/core/event-consumers";
import { SeedHelper } from "sc-game-base/src/core/helpers";
import GameData from "../game-data";
import { generateServerSeedAndHash } from "../helpers/pf-helper";
import { GameConfigs, LightningBoard, PlaceBetPayload, SettlementResult } from "../types";
import { BaseEventConsumers, BaseEventPublishers, GameDefinition } from "sc-game-base/src/core";
import { LightningBoardAssigner } from "../lightning-feature/lightning-board-assigner";
import { GAME_MODE, NUMBER_OF_ROWS } from "../constants";

type ResultData = {
    serverSeedHash: string;
    serverSeed: string;
    clientSeeds: { name: string; clientSeed: string }[];
    mergeClientSeed: string;
    mergeSeed: string;
    finalHash: string;
};

export default class RoundResultConsumer extends BaseRoundResultConsumer {
    declare gameData: GameData;
    lightningBoardAssigner: LightningBoardAssigner;

    constructor(
        gameData: GameData,
        definition: GameDefinition,
        roundResultPublisher: BaseEventPublishers.RoundResultPublisher,
        resultsRepository: any,
        provablyFairConsumer: BaseEventConsumers.ProvablyFairConsumer,
        lightningBoardAssigner: LightningBoardAssigner
    ) {
        super(gameData, definition, roundResultPublisher, resultsRepository, provablyFairConsumer);
        this.lightningBoardAssigner = lightningBoardAssigner;
    }

    getResultFromAdmin(playerName: string) {
        const resultFromAdmin = this.gameData.settlementResultFromAdmin?.result;
        if (resultFromAdmin?.playerName === playerName) {
            this.gameData.settlementResultFromAdmin = {};
            return resultFromAdmin.result;
        }
        return null;
    }

    async generateRoundData(playerName: string, roundId: number, payload: PlaceBetPayload) {
        const { numberOfRows, gameMode, isLightningMode, lightningKey } = payload;
        const result = (await this.generateResultByBet(playerName, roundId, payload)).slice(0, numberOfRows);
        const { plinkoConfig } = this.gameData.gameConfigs as unknown as GameConfigs;
        let board: LightningBoard | null = null;
        if (isLightningMode) {
            ({ board } = this.lightningBoardAssigner.assignBoard(playerName, lightningKey));
        }
        const odds = { ...plinkoConfig?.odds, [GAME_MODE.LIGHTNING]: { [NUMBER_OF_ROWS.lightning]: board?.odds || [] } };
        const settlementResult = this.definition.settle(
            result,
            odds?.[gameMode]?.[numberOfRows],
            board?.pegMultipliers
        ) as SettlementResult;
        return { result, settlementResult, odds, board };
    }

    async generateResultByBet(playerName: string, roundId: number, payload: PlaceBetPayload): Promise<number[]> {
        const resultFromAdmin = this.getResultFromAdmin(playerName);
        if (resultFromAdmin) {
            return resultFromAdmin;
        }
        const isTrialMode = payload.amount === 0;
        const resultData = this.generateResultData(playerName, isTrialMode);
        !isTrialMode && (await this.createResultDocument(resultData, roundId));
        return this.definition.generateResult(resultData.finalHash);
    }

    generateResultData(playerName: string, isTrialMode: boolean): ResultData {
        const { randomMode } = this.gameData.gameConfigs;
        if (isTrialMode) {
            const { serverSeed } = generateServerSeedAndHash(randomMode);
            return {
                serverSeedHash: "",
                serverSeed: serverSeed,
                clientSeeds: [],
                mergeClientSeed: "",
                mergeSeed: serverSeed,
                finalHash: SeedHelper.getSHA512Hash(serverSeed),
            };
        }
        const { clientSeed } = this.gameData.ingame[playerName];
        const clientSeeds = [{ name: playerName, clientSeed }];
        const { serverSeedHash, serverSeed } = this.gameData.playerPf[playerName] || generateServerSeedAndHash(randomMode);
        const mergeClientSeed = SeedHelper.getMergeClientSeed(clientSeeds);
        const mergeSeed = serverSeed + mergeClientSeed;
        const finalHash = SeedHelper.getSHA512Hash(mergeSeed);
        return {
            serverSeedHash: serverSeedHash || "",
            serverSeed: serverSeed || "",
            clientSeeds,
            mergeClientSeed,
            mergeSeed,
            finalHash,
        };
    }

    async createResultDocument(resultData: ResultData, roundId: number) {
        const { serverSeedHash, serverSeed, clientSeeds, mergeClientSeed, mergeSeed, finalHash } = resultData;
        await this.resultsRepository.create({
            roundId,
            serverSeedHash,
            serverSeed,
            clientSeeds,
            mergeClientSeed,
            mergeSeed,
            finalHash,
            time: new Date(),
        });
    }
}
