import { SeedHelper, ServerSeedHelper } from "sc-game-base/src/core/helpers";

export const generateServerSeedAndHash = (randomMode = 1) => {
    const serverSeed = ServerSeedHelper.generateServerSeed(randomMode);
    const serverSeedHash = SeedHelper.getSHA256Hash(serverSeed);
    return { serverSeedHash, serverSeed };
};
