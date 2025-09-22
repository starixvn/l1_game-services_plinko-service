import { CHOICE_MAPPER } from "../../src/constants";

describe("Constants", () => {
    it("should have the correct ChoiceMapper", () => {
        expect(CHOICE_MAPPER).toBeDefined();
        expect(CHOICE_MAPPER[0]).toEqual({ 8: 1, 9: 2, 10: 3, 11: 4, 12: 5, 13: 6, 14: 7, 15: 8, 16: 9 });
        expect(CHOICE_MAPPER[1]).toEqual({ 8: 10, 9: 11, 10: 12, 11: 13, 12: 14, 13: 15, 14: 16, 15: 17, 16: 18 });
        expect(CHOICE_MAPPER[2]).toEqual({ 8: 19, 9: 20, 10: 21, 11: 22, 12: 23, 13: 24, 14: 25, 15: 26, 16: 27 });
    });
});
