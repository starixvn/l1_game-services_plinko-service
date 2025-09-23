import gameSetting from "./game-settings";
import mongoose from "mongoose";
import { GameConfigSchema } from "../models/game-config";

export const game = {
    id: gameSetting.id,
    name: gameSetting.name,
};

export const currencyData = { code: "USD", name: "$US" };

export const socketOptionsFunc = (port) => ({
    socketUri: `http://localhost:${port}/user/${gameSetting.name.toLowerCase()}`,
    gameName: game.name,
    proxyRoute: "/socket.io",
});

export const gameConfig = {
    type: 0,
    name: gameSetting.name.toLowerCase(),
    minBet: 1,
    maxBet: 3000,
    maxBetPerChoices: { player: 3000, banker: 3000, tie: 3000, anyPair: 3000 },
    botenabled: false,
    choices_maxbet: { player: 3000, banker: 3000, tie: 3000, anyPair: 3000 },
    plinkoConfig: {
        odds: {
            0: {
                8: [1, 2, 3, 4, 5, 6, 7, 8, 9],
                9: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                11: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                12: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
                13: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
                14: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                15: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
                16: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
            },
            1: {
                8: [1, 2, 3, 4, 5, 6, 7, 8, 9],
                9: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                11: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                12: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
                13: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
                14: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                15: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
                16: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
            },
            2: {
                8: [1, 2, 3, 4, 5, 6, 7, 8, 9],
                9: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                11: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                12: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
                13: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
                14: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                15: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
                16: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
            },
        },
    },
};

export const createGameConfig = async () => {
    const defaultGameConfig = {
        enabled: true,
        minbet: 1,
        maxbet: 3000,
        disabledround: 1,
        botenabled: false,
        maxbot: 0,
        bot_maxbet: 1000000,
        bot_minbet: 1,
        hour_maxbot: [
            0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01,
            0.01, 0.01, 0.01,
        ],
        disabled_message: "This game is under maintenance11111, it will be back shortly to upgrade new version.",
        delayStartTime: 0,
    };

    const mergedGameConfig = { ...defaultGameConfig, ...gameConfig };
    delete mongoose.models["game_configs"];
    const gameConfigModel = mongoose.model("game_configs", GameConfigSchema);
    return gameConfigModel.findOneAndUpdate({ name: mergedGameConfig.name }, mergedGameConfig, {
        new: true,
        upsert: true,
    });
};

export const pfResults = [
    {
        clientSeeds: [{ name: "OtherUser", seed: "1234" }],
        roundId: 2,
        serverSeedHash: "c1c4857aa423eaff150fc6e765cf49241b8766090baf597143637a4f28dd6477",
        serverSeed: "ww4G8G]ofL8VsAA(4!&vIEZ(l%l[sD9$fZnR@^0K",
        finalHash: "1377588d03c484407b9904d7935d52d04c9bb8c14766bca6200774ee3ce583f0",
        mergeSeed: "ww4G8G]ofL8VsAA(4!&vIEZ(l%l[sD9$fZnR@^0K1234",
        mergeClientSeed: "1234",
        __v: 0,
    },
    {
        clientSeeds: [{ name: "NormalUser", seed: "1234" }],
        roundId: 1,
        serverSeedHash: "c1c4857aa423eaff150fc6e765cf49241b8766090baf597143637a4f28dd6477",
        serverSeed: "ww4G8G]ofL8VsAA(4!&vIEZ(l%l[sD9$fZnR@^0K",
        finalHash: "1377588d03c484407b9904d7935d52d04c9bb8c14766bca6200774ee3ce583f0",
        mergeSeed: "ww4G8G]ofL8VsAA(4!&vIEZ(l%l[sD9$fZnR@^0K1234",
        mergeClientSeed: "1234",
        __v: 0,
    },
];

export const createRoundData = (uid) => {
    return [
        {
            id: 2,
            uid: "otheruser",
            name: "OtherUser",
            amount: 100,
            totalAmount: 100,
            betWin: 500,
            odds: gameConfig.plinkoConfig.odds,
            clientSeed: "1234",
            currency: "$US",
            rate: 1,
            siteId: "111",
            playerId: 2,
            operatorId: "dummy-operator-id",
            paid: true,
            appType: 1,
            gameMode: 0,
            numberOfRows: 8,
            result: [1, 1, 0, 1, 1, 0, 0, 0],
            settlementResult: { slotIndex: 4, multiplier: 5 },
            exchangeRateId: 2089,
        },
        {
            id: 1,
            uid: uid,
            name: "NormalUser",
            amount: 100,
            totalAmount: 100,
            betWin: 500,
            odds: gameConfig.plinkoConfig.odds,
            clientSeed: "1234",
            currency: "$US",
            rate: 1,
            siteId: "111",
            playerId: 1,
            operatorId: "dummy-operator-id",
            paid: true,
            appType: 1,
            gameMode: 0,
            numberOfRows: 8,
            result: [1, 1, 0, 1, 1, 0, 0, 0],
            settlementResult: { slotIndex: 4, multiplier: 5 },
            exchangeRateId: 2089,
        },
    ];
};
