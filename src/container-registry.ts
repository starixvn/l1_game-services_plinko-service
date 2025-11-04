import { asClass, asValue } from "awilix";
import { Table, Core } from "sc-game-base";

import {
    PlaceBetConsumer,
    SettleGameRoundConsumer,
    RoundResultConsumer,
    InGameConsumer,
    UserDisconnectConsumer,
    TrialModeConsumer,
} from "./consumers";
import { Bot, GameCron, ProcessBetQueue } from "./crons";
import { Results, Rounds } from "./models";
import RoundQuery from "./query-apis/round-query";
import SocketRouter from "./routers/socket-router";
import { LightningBoardAssigner } from "./lightning-feature/lightning-board-assigner";

export default class ContainerRegistry extends Core.ContainerRegistry {
    register(appConfigs: any, definition: Core.GameDefinition, gameData: Core.GameData) {
        const container = super.register(appConfigs, definition, gameData);
        this.registerLightningFeature();
        return container;
    }

    registerConsumers() {
        super.registerConsumers();

        this.container.register({
            inGameConsumer: asClass(InGameConsumer).singleton(),
            placeBetConsumer: asClass(PlaceBetConsumer).singleton(),
            roundResultConsumer: asClass(RoundResultConsumer).singleton(),
            settleGameRoundConsumer: asClass(SettleGameRoundConsumer).singleton().proxy(),
            userSignInConsumer: asClass(Table.EventConsumers.TableUserSignInConsumer).singleton().proxy(),
            userDisconnectConsumer: asClass(UserDisconnectConsumer).singleton(),
            trialModeConsumer: asClass(TrialModeConsumer).singleton().proxy(),
        });
    }

    registerCrons() {
        super.registerCrons();

        this.container.register({
            bot: asClass(Bot).singleton(),
            gameCron: asClass(GameCron).singleton().proxy(),
            processBetQueue: asClass(ProcessBetQueue).singleton().proxy(),
        });
    }

    registerPublishers() {
        super.registerPublishers();

        this.container.register({
            userSignInPublisher: asClass(Table.EventPublishers.TableUserSignInPublisher).singleton(),
        });
    }

    registerModels() {
        super.registerModels();

        this.container.register({
            roundsRepository: asValue(Rounds),
            resultsRepository: asValue(Results),
            betsRepository: asValue(undefined),
            betLogsRepository: asValue(undefined),
            tempBetsRepository: asValue(undefined),
        });
    }

    registerApis() {
        super.registerApis();

        this.container.register({
            roundQuery: asClass(RoundQuery).singleton(),
        });
    }

    registerRouters() {
        super.registerRouters();

        this.container.register({
            socketRouter: asClass(SocketRouter).proxy(),
        });
    }

    registerLightningFeature() {
        this.container.register({
            lightningBoardAssigner: asClass(LightningBoardAssigner).singleton().proxy(),
        });
    }
}
