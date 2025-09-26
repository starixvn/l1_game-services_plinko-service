// Hardcoded game configuration for local testing
const hardcodedGameConfig = {
    type: 0,
    name: "plinko",
    minBet: 1,
    maxBet: 3000,
    maxBetPerChoices: {},
    botenabled: false,
    maxWinPerRound: 100000,
    delayStartTime: 0,
    enableFreeBet: false,
    enabled: true,
    maxbot: 0,
    minbot: 0,
    bot_maxbet: 1000000,
    bot_minbet: 1,
    hour_maxbot: [
        0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01,
        0.01, 0.01,
    ],
    disabled_message: "Game is under maintenance",
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
    randomMode: 0,
    siteExclusions: [],
    exchangeReload: false,
    gameId: 145,
};

export default {
    hostingPort: 5000,
    hardcodedGameConfig, // Add hardcoded game config for local testing
    apiSettings: {
        enabledApi: false, // Disabled for local testing
        apiUrl: "https://l2-proxy1.lumigame.com/game-api",
        authUrl: "https://l2-auth1.lumigame.com",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&",
        },
        useAuthenticate: false, // Disabled for local testing
        requestTimeout: 10000,
        placeBetTimeout: 2000,
        enabledApiLogs: true,
    },
    authenticateSettings: {
        url: "https://l2-auth1.lumigame.com",
        id: "game-services",
        secret: "gameservices@20luminet&",
        requestTimeout: 10000,
        useAuthenticate: false, // Disabled for local testing
        audiences: ["api", "admin-api"],
    },
    userServiceSettings: {
        url: "https://l2-proxy1.lumigame.com/user",
    },
    socketOptions: {
        pingInterval: 60 * 1000,
        pingTimeout: 60 * 1000,
        transports: ["websocket"],
        allowUpgrades: false,
        perMessageDeflate: false,
    },
    enabledLogs: true,
    database: {
        url: "mongodb://localhost:27017/", // Use local MongoDB
        options: {
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
        enabled: true, // Keep enabled but will use mock models
    },
    sentry: {
        sentryUrl: "",
        logIdentifier: "plinko",
        env: "DEV",
    },
    adminSecretKey: "asWDEerfOIdgsdqRTFabvmgh",
    disableCors: true,
    gameManagementApiSettings: {
        BASE: "https://l2-proxy1.lumigame.com/game-management-service",
        enabled: false, // Disabled for local testing
    },
    trackingApiSettings: {
        baseUrl: "https://l2-proxy1.lumigame.com/user-tracking-api/",
        enabled: false, // Disabled for local testing
    },
};
