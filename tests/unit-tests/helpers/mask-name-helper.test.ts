import { maskName } from "../../../src/helpers/mask-name-helper";

describe("maskName", () => {
    it("should return name if length is less than 3", () => {
        expect(maskName("Re")).toBe("Re");
    });
    it("should mask name correctly with length 3", () => {
        expect(maskName("Rex")).toBe("R***ex");
    });
    it("should mask name correctly with > 3", () => {
        expect(maskName("Rex123")).toBe("R***123");
    });
});
