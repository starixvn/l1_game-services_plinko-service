import { roundDownTo } from "../../../src/helpers/number-helper";

describe("number-helper", () => {
    describe("roundDownTo", () => {
        it("should round down to the nearest integer", () => {
            expect(roundDownTo(1.23456, 3)).toBe(1.234);
        });
        it("should round down to the nearest integer", () => {
            expect(roundDownTo(1.999999)).toBe(1.99);
        });
    });
});
