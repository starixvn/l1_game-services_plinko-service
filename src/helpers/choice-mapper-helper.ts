import { NUMBER_OF_ROWS } from "../constants";

export const getChoiceId = (gameMode: number, numberOfRows: number) => {
    return gameMode * (NUMBER_OF_ROWS.max - NUMBER_OF_ROWS.min + 1) + (numberOfRows - NUMBER_OF_ROWS.min + 1);
};
