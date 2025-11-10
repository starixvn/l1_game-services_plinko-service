export const roundDownTo = (number: number, decimals = 2) => {
    const power = 10 ** decimals;
    return Math.floor(number * power) / power;
};
