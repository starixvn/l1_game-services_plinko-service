module.exports = async () => {
    return {
        rootDir: "./",
        verbose: true,
        transform: {
            "^.+\\.ts?$": "ts-jest",
            "^.+\\.js?$": "babel-jest",
        },
        transformIgnorePatterns: [
            "node_modules/(?!(sc-base-database|sc-common|sc-game-base|sc-base-apis|sc-api-client|jest-auto-fixture|internmap|axios|nanoid|crypto-random-string|sc-game-service-integration-utils|sc-game-management-client|prom-client|@sc/user-tracking-client|openid-client|oauth4webapi|jose)/.*)",
        ],
        preset: "ts-jest",
        testEnvironment: "node",
        testResultsProcessor: "jest-sonar-reporter",
        reporters: ["default", ["jest-junit", { outputDirectory: "coverage", outputName: "unit-tests.xml" }]],
        coverageReporters: ["clover", "lcov", "text-summary", "cobertura", "text"],
        coverageDirectory: "coverage",
        collectCoverageFrom: ["src/{consumers,crons,publishers,helpers,routers,query-apis,lightning-feature}/**/*.ts"],
        coveragePathIgnorePatterns: ["/node_modules/", "src/.*\\.(models|configs)\\.ts$", "src/.*/index\\.ts$"],
    };
};
