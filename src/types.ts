export type PlinkoOdds = Record<number, Record<number, number[]>>;
export type PlinkoConfig = {
    odds: PlinkoOdds;
    enabledLightningMode?: boolean;
};
export type SettlementResult = {
    slotIndex: number;
    multiplier: number;
    reachedPegMultipliers?: PegMultiplier[];
};
export type PlinkoRound = {
    id: number;
    result: number[];
    settlementResult: SettlementResult;
    uid: string;
    name: string;
    amount: number;
    totalAmount: number;
    betWin: number;
    reachMaxWin: boolean;
    paid: true;
    rate: number;
    odds: PlinkoOdds;
    time: Date;
    clientSeed: string;
    currency: string;
    siteId: string;
    siteName: string;
    playerId: string;
    operatorId: string;
    appType: number;
    gameMode: number;
    numberOfRows: number;
    lightningKey?: string;
    lightningBoard?: LightningBoard | null;
    exchangeRateId: number;
};
export type GameConfigs = {
    choices_maxbet: Record<string, number>;
    delayStartTime: number;
    enableFreeBet: boolean;
    enabled: boolean;
    maxbet: number;
    maxWinPerRound: number;
    maxbot: number;
    minbet: number;
    odds: Record<string, number>;
    randomMode: number;
    name: string;
    siteExclusions: string[];
    exchangeReload: boolean;
    gameId: number;
    displayName: string;
    type: number;
    plinkoConfig: PlinkoConfig;
};

export type PlaceBetPayload = {
    amount: number;
    gameMode: number;
    numberOfRows: number;
    clientSeed: string;
    isLightningMode?: boolean;
    lightningKey?: string;
    time?: Date;
    receivedTime?: Date;
    freeBet?: boolean;
    m?: string;
    mode?: string;
    roundId?: number;
};

export type PegMultiplier = {
    row: number;
    column: number;
    multiplier: number;
};

export type LightningBoard = {
    odds: number[];
    pegMultipliers: PegMultiplier[];
};
