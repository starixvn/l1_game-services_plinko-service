import { getChoiceId } from "../../../src/helpers/choice-mapper-helper";

describe("Choice Mapper", () => {
    const testCases = [
        { gameMode: 0, numberOfRows: 8, expected: 1 },
        { gameMode: 0, numberOfRows: 9, expected: 2 },
        { gameMode: 0, numberOfRows: 10, expected: 3 },
        { gameMode: 0, numberOfRows: 11, expected: 4 },
        { gameMode: 0, numberOfRows: 12, expected: 5 },
        { gameMode: 0, numberOfRows: 13, expected: 6 },
        { gameMode: 0, numberOfRows: 14, expected: 7 },
        { gameMode: 0, numberOfRows: 15, expected: 8 },
        { gameMode: 0, numberOfRows: 16, expected: 9 },
        { gameMode: 1, numberOfRows: 8, expected: 10 },
        { gameMode: 1, numberOfRows: 9, expected: 11 },
        { gameMode: 1, numberOfRows: 10, expected: 12 },
        { gameMode: 1, numberOfRows: 11, expected: 13 },
        { gameMode: 1, numberOfRows: 12, expected: 14 },
        { gameMode: 1, numberOfRows: 13, expected: 15 },
        { gameMode: 1, numberOfRows: 14, expected: 16 },
        { gameMode: 1, numberOfRows: 15, expected: 17 },
        { gameMode: 1, numberOfRows: 16, expected: 18 },
        { gameMode: 2, numberOfRows: 8, expected: 19 },
        { gameMode: 2, numberOfRows: 9, expected: 20 },
        { gameMode: 2, numberOfRows: 10, expected: 21 },
        { gameMode: 2, numberOfRows: 11, expected: 22 },
        { gameMode: 2, numberOfRows: 12, expected: 23 },
        { gameMode: 2, numberOfRows: 13, expected: 24 },
        { gameMode: 2, numberOfRows: 14, expected: 25 },
        { gameMode: 2, numberOfRows: 15, expected: 26 },
        { gameMode: 2, numberOfRows: 16, expected: 27 },
    ];
    it.each(testCases)("should return the correct choice mapper", ({ gameMode, numberOfRows, expected }) => {
        expect(getChoiceId(gameMode, numberOfRows)).toBe(expected);
    });
});
