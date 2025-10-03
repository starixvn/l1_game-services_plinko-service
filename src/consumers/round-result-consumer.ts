import { RoundResultConsumer as BaseRoundResultConsumer } from "sc-game-base/src/core/event-consumers";
import { SeedHelper } from "sc-game-base/src/core/helpers";
import GameData from "../game-data";
import { generateServerSeedAndHash } from "../helpers/pf-helper";

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

    getResultFromAdmin(playerName: string) {
        const resultFromAdmin = this.gameData.settlementResultFromAdmin?.result;
        if (resultFromAdmin?.playerName === playerName) {
            this.gameData.settlementResultFromAdmin = {};
            return resultFromAdmin.result;
        }
        return null;
    }

    async generateResultByBet(playerName: string, roundId: number): Promise<number[]> {
        const resultFromAdmin = this.getResultFromAdmin(playerName);
        if (resultFromAdmin) {
            return resultFromAdmin;
        }
        const resultData = this.generateResultData(playerName);
        await this.createResultDocument(resultData, roundId);
        return this.definition.generateResult(resultData.finalHash);
    }

    generateResultData(playerName: string): ResultData {
        const { clientSeed } = this.gameData.ingame[playerName];
        const clientSeeds = [{ name: playerName, clientSeed }];
        const { serverSeedHash, serverSeed } =
            this.gameData.playerPf[playerName] || generateServerSeedAndHash(this.gameData.gameConfigs.randomMode);
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
