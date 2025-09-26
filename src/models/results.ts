// Mock model for local testing - bypasses MongoDB
import gameSettings from "../game-settings";

const mockResults: any[] = [];

// Mock mongoose-like interface
const mockModel = {
    find: () => Promise.resolve(mockResults),
    findOne: () => Promise.resolve(null),
    create: (data: any) => {
        mockResults.push(data);
        return Promise.resolve(data);
    },
    findOneAndUpdate: () => Promise.resolve(null),
    save: function () { return Promise.resolve(this); }
};

export default mockModel;
