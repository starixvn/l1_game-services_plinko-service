export const maskName = (name: string) => {
    if (!name || name.length <= 2) {
        return name;
    }

    if (name.length === 3) {
        const firstChar = name.charAt(0);
        const lastTwoChars = name.slice(-2);
        return `${firstChar}***${lastTwoChars}`;
    }

    const firstChar = name.charAt(0);
    const lastThreeChars = name.slice(-3);

    return `${firstChar}***${lastThreeChars}`;
};
