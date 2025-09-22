import { Core } from "sc-game-base";
import mongoose from "mongoose";
import gameSettings from "../game-settings";

export default mongoose.model(`${gameSettings.name.toLocaleLowerCase()}_results`, Core.Models.ResultSchema);
