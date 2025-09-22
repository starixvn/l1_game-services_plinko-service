export const NUMBER_OF_ROWS = {
    min: 8,
    max: 16,
};

export const GAME_MODE = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
};

export type ChoiceMapper = {
    [mode: number]: {
        [numberOfRows: number]: number;
    };
};

const createChoiceMapper = (): ChoiceMapper => {
    let count = 1;

    return Object.values(GAME_MODE).reduce((mapper, mode) => {
        mapper[mode] = {};
        for (let rows = NUMBER_OF_ROWS.min; rows <= NUMBER_OF_ROWS.max; rows++) {
            mapper[mode][rows] = count;
            count++;
        }
        return mapper;
    }, {} as ChoiceMapper);
};
export const CHOICE_MAPPER: ChoiceMapper = createChoiceMapper();
