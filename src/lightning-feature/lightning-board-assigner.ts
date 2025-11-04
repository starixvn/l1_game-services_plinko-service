import Chance from "chance";
import * as fs from "fs";
import * as path from "path";
import { LightningBoard } from "../types";
import { logger } from "sc-common";
import { generateRandomString, isValidLightningKey } from "../helpers/string-helper";

const TOTAL_BOARDS = 99_900;
const BATCH_SIZE = 500;

export class LightningBoardAssigner {
    private readonly playerToKey: Map<string, string>;
    private readonly chance: Chance.Chance;
    private readonly batchCache: Map<number, LightningBoard[]> = new Map();
    private readonly logService: typeof logger;

    constructor({ logService }: { logService: typeof logger }) {
        this.playerToKey = new Map(); // playerName → key
        this.chance = new Chance();
        this.logService = logService;
    }

    getPlayerKey(playerName: string) {
        if (this.playerToKey.has(playerName)) {
            return this.playerToKey.get(playerName) as string;
        }

        const keyLength = this.chance.integer({ min: 4, max: 8 });
        const key = generateRandomString(keyLength);

        this.playerToKey.set(playerName, key);
        return key;
    }

    getBoardIndexFromKey(key: string) {
        // FNV-1a 32-bit hash
        const PRIME = 0x01000193; // prime for FNV
        let hash = 0x811c9dc5; // offset basis

        for (let i = 0; i < key.length; i++) {
            hash ^= key.charCodeAt(i);
            hash = (hash * PRIME) >>> 0;
        }
        return hash % TOTAL_BOARDS;
    }

    getBoardFromFile(index: number) {
        const batchIndex = Math.floor(index / BATCH_SIZE);
        const boardIndex = index % BATCH_SIZE;

        // Check if batch is already cached
        if (this.batchCache.has(batchIndex)) {
            const cachedBatch = this.batchCache.get(batchIndex);
            return cachedBatch?.[boardIndex] || null;
        }

        // Read batch from file
        const batchFileNumber = batchIndex + 1;
        // Resolve path relative to project root (works on both Windows and Linux)
        // process.cwd() returns the current working directory where the app was started
        try {
            const batchFilePath = path.resolve(process.cwd(), "lightning-data", "batches", `${batchFileNumber}.json`);
            const batchData = JSON.parse(fs.readFileSync(batchFilePath, "utf-8")) as LightningBoard[];

            // Store in cache
            this.batchCache.set(batchIndex, batchData);

            return batchData[boardIndex] || null;
        } catch (error) {
            console.error(`Error reading batch file ${batchFileNumber}.json: ${error}`);
            this.logService.logError(`Error reading batch file ${batchFileNumber}.json: ${error}`);
            return null;
        }
    }

    getBoardFromIndex(index: number, retries = 0): LightningBoard | null {
        let board = this.getBoardFromFile(index);
        if (!board && retries < 10) {
            const newIndex = index + 1;
            board = this.getBoardFromIndex(newIndex, retries + 1);
        }
        return board;
    }

    assignBoard(playerName: string, lightningKey?: string) {
        let key = lightningKey;
        if (!key || !isValidLightningKey(key)) {
            key = this.getPlayerKey(playerName);
        }
        this.playerToKey.set(playerName, key);
        const boardIndex = this.getBoardIndexFromKey(key);
        const board = this.getBoardFromIndex(boardIndex);
        return { key, board };
    }
}
