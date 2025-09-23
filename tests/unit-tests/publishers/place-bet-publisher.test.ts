import PlaceBetPublisher from "../../../src/publishers/place-bet-publisher";
import { maskName } from "../../../src/helpers/mask-name-helper";

jest.mock("../../../src/helpers/mask-name-helper", () => ({
    maskName: jest.fn(),
}));
describe("PlaceBetPublisher", () => {
    it("should publish player bet result", () => {
        // Arrange
        // @ts-ignore
        const publisher = new PlaceBetPublisher();
        publisher.publishToAllUsers = jest.fn();
        (maskName as jest.Mock).mockReturnValue("J***Doe");

        // Act
        publisher.publishPlayerBetResult("John Doe", 100, 100);

        // Assert
        expect(maskName).toHaveBeenCalledWith("John Doe");
        expect(publisher.publishToAllUsers).toHaveBeenCalledWith({ playerBet: { playerName: "J***Doe", amount: 100, winAmount: 100 } });
    });
});
