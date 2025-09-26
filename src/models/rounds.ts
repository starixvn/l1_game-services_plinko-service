// Mock model for local testing - bypasses MongoDB
import gameSettings from "../game-settings";

const mockRounds: any[] = [];

// Mock mongoose-like interface
const mockModel = {
    find: (query?: any) => {
        if (query && query.uid) {
            return Promise.resolve(mockRounds.filter((round: any) => round.uid === query.uid));
        }
        return Promise.resolve(mockRounds);
    },
    findOne: (query?: any) => {
        if (query && query.id) {
            return Promise.resolve(mockRounds.find((round: any) => round.id === query.id) || null);
        }
        return Promise.resolve(null);
    },
    create: (data: any) => {
        const newRound = { ...data, id: mockRounds.length + 1 };
        mockRounds.push(newRound);
        return Promise.resolve(newRound);
    },
    findOneAndUpdate: (query: any, update: any, options: any) => {
        let round = mockRounds.find((r: any) => r.uid === query.uid && r.id === query.id);
        if (!round) {
            round = { ...query, ...update };
            mockRounds.push(round);
        } else {
            Object.assign(round, update);
        }
        return Promise.resolve(round);
    },
    save: function () { return Promise.resolve(this); }
};

export default mockModel;
