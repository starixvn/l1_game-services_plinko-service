import Chance from "chance";
const chance = new Chance();

export const generateRandomString = (length: number) => {
    return chance.string({ length, alpha: true, numeric: true });
};

export const isValidLightningKey = (key: string) => {
    return /^[a-zA-Z0-9]+$/.test(key) && key.length >= 1 && key.length <= 8;
};
