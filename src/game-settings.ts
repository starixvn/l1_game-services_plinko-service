import { CHOICE_MAPPER } from "./constants";

export default {
    id: 145,
    name: "Plinko",
    durations: {
        wholeRound: 60,
    },
    choices: [],
    choicesMapper: CHOICE_MAPPER,
    hedgeBetGroups: [],
    numberOfRoundHistory: 10,
    historyPageSize: 10,
    provablyFair: true,
};
