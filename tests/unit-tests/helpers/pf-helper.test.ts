import { SeedHelper, ServerSeedHelper } from "sc-game-base/src/core/helpers";
import { generateServerSeedAndHash } from "../../../src/helpers/pf-helper";

// Mock helper
jest.mock("sc-game-base/src/core/helpers", () => ({
    ServerSeedHelper: {
        generateServerSeed: jest.fn().mockReturnValue("serverSeed"),
    },
    SeedHelper: {
        getSHA256Hash: jest.fn().mockReturnValue("serverSeedHash"),
    },
}));
describe("generateServerSeedAndHash", () => {
    it("should generate server seed and hash", () => {
        // Arrange
        const randomMode = 2;

        // Act
        const result = generateServerSeedAndHash(randomMode);

        // Assert
        expect(result).toEqual({ serverSeedHash: "serverSeedHash", serverSeed: "serverSeed" });
        expect(ServerSeedHelper.generateServerSeed).toHaveBeenCalledWith(randomMode);
        expect(SeedHelper.getSHA256Hash).toHaveBeenCalledWith("serverSeed");
    });

    it("should generate server seed and hash with random mode 1 when random mode is not provided", () => {
        // Act
        const result = generateServerSeedAndHash();

        // Assert
        expect(result).toEqual({ serverSeedHash: "serverSeedHash", serverSeed: "serverSeed" });
        expect(ServerSeedHelper.generateServerSeed).toHaveBeenCalledWith(1);
        expect(SeedHelper.getSHA256Hash).toHaveBeenCalledWith("serverSeed");
    });
});
