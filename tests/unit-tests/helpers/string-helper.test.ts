import { generateRandomString, isValidLightningKey } from "../../../src/helpers/string-helper";

describe("string-helper", () => {
    describe("generateRandomString", () => {
        it("should generate a random string alpha numeric", () => {
            // Act
            const strings = Array.from({ length: 100 }, () => generateRandomString(10));

            // Assert
            expect(strings.every((string) => string.length === 10)).toBe(true);
            expect(strings.every((string) => /^[a-zA-Z0-9]+$/.test(string))).toBe(true);
        });
    });
    describe("isValidLightningKey", () => {
        it("should return true for alpha numeric string", () => {
            // Act
            const result = isValidLightningKey("abc123xy");
            // Assert
            expect(result).toBe(true);
        });

        const invalidStrings = ["test,", "test@", "123456!789", "", "1234567890"];
        invalidStrings.forEach((string) => {
            it(`should return false for invalid string: ${string}`, () => {
                // Act
                const result = isValidLightningKey(string);
                // Assert
                expect(result).toBe(false);
            });
        });
    });
});
