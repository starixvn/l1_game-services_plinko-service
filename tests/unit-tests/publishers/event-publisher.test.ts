import EventPublisher from "../../../src/publishers/event-publisher";
import { maskName } from "../../../src/helpers/mask-name-helper";

jest.mock("../../../src/helpers/mask-name-helper", () => ({
    maskName: jest.fn(),
}));

const mockPickone = jest.fn();

jest.mock(
    "chance",
    () =>
        class {
            pickone = mockPickone;
        }
);

describe("EventPublisher", () => {
    let mockGameData: any;
    let publisher: EventPublisher;
    beforeEach(() => {
        jest.clearAllMocks();
        mockGameData = {
            playerResultBoard: [],
        };
        // @ts-ignore
        publisher = new EventPublisher();
        publisher.gameData = mockGameData;
        publisher.publishToAllUsers = jest.fn();
    });

    describe("publishPlayerResultBoard", () => {
        it("should not publish player result board if player result board is empty", () => {
            // Act
            publisher.publishPlayerResultBoard();

            // Assert
            expect(publisher.publishToAllUsers).not.toHaveBeenCalled();
        });

        it("should not publish player result board if player result board is not exist", () => {
            // Arrange
            mockGameData.playerResultBoard = undefined;

            // Act
            publisher.publishPlayerResultBoard();

            // Assert
            expect(publisher.publishToAllUsers).not.toHaveBeenCalled();
        });

        it("should publish player bet result", () => {
            // Arrange
            const data = { playerName: "John Doe", amount: 100, winAmount: 100 };
            mockGameData.playerResultBoard = [data];
            (maskName as jest.Mock).mockReturnValue("J***Doe");
            mockPickone.mockReturnValue(data);

            // Act
            publisher.publishPlayerResultBoard();

            // Assert
            expect(maskName).toHaveBeenCalledWith("John Doe");
            expect(publisher.publishToAllUsers).toHaveBeenCalledWith({ playerBet: { playerName: "J***Doe", amount: 100, winAmount: 100 } });
        });
    });
});
