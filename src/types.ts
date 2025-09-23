export type PlinkoOdds = Record<number, Record<number, number[]>>;
export type PlinkoConfig = {
    odds: PlinkoOdds;
};
export type SettlementResult = {
    slotIndex: number;
    multiplier: number;
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
    paid: true;
    rate: number;
    odds: PlinkoOdds;
    time: Date;
    clientSeed: string;
    currency: string;
    siteId: string;
    playerId: string;
    operatorId: string;
    appType: number;
    gameMode: number;
    numberOfRows: number;
    freeBet: boolean;
    exchangeRateId: number;
};
export type GameConfigs = {
    choices_maxbet: Record<string, number>;
    delayStartTime: number;
    enableFreeBet: boolean;
    enabled: boolean;
    maxbet: number;
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
    time?: Date;
    receivedTime?: Date;
    freeBet?: boolean;
    m?: string;
    mode?: string;
};
