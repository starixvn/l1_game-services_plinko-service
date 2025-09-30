import mongoose from "mongoose";
import gameSettings from "../game-settings";
const modelName = `${gameSettings.name.toLocaleLowerCase()}_rounds`;

const settlementResultSchema = new mongoose.Schema(
    {
        slotIndex: { type: Number, required: true },
        multiplier: { type: Number, required: true },
    },
    { _id: false }
);

const Schema = new mongoose.Schema({
    id: { type: Number, required: true },
    uid: { type: String, required: true },
    name: { type: String, required: true },

    amount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    betWin: { type: Number, default: 0 },
    reachMaxWin: { type: Boolean, default: false },
    time: { type: Date, default: Date.now },
    odds: { type: Object }, // {[mode: number]: {[numberOfRows: number]: number[] }}
    clientSeed: { type: String, default: "" },

    currency: { type: String },
    rate: { type: Number, required: true },
    siteId: { type: String },
    siteName: { type: String },
    playerId: { type: String },
    operatorId: { type: String, required: false },
    paid: { type: Boolean, default: false },
    appType: { type: Number, default: 0 },

    gameMode: { type: Number, default: 0 }, // 0 - low, 1 - medium, 2 - high
    numberOfRows: { type: Number, default: 10 },
    result: { type: [Number], required: true }, // path, 0-left, 1-right
    settlementResult: settlementResultSchema,
    exchangeRateId: { type: Number, required: true },
});

export default mongoose.model(modelName, Schema);
