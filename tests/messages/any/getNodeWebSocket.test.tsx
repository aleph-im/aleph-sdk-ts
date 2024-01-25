import { any } from "../../index";
import { AlephNodeWebSocket } from "../../../src/messages/any/AlephNodeWebSocket";

describe("Test Node WebSocket", () => {
    function waitForSocketState(socket: AlephNodeWebSocket, state: boolean): Promise<void> {
        return new Promise(function (resolve) {
            setTimeout(function () {
                if (
                    socket.getIsOpen() === state &&
                    ((state === true && socket.getData().length !== 0) || state === false)
                ) {
                    resolve();
                } else {
                    waitForSocketState(socket, state).then(resolve);
                }
            }, 5);
        });
    }

    // As testing webSocket could take a long time, only one test is made
    // A socket can take around 30seconds to close be it's needed for the GA
    it("Try to open and close the webSocket", async () => {
        const nodeSocket = await any.GetMessagesSocket({ addresses: ["0xB68B9D4f3771c246233823ed1D3Add451055F9Ef"] });
        await waitForSocketState(nodeSocket as AlephNodeWebSocket, true);
        expect(nodeSocket.getIsOpen()).toStrictEqual(true);

        expect(nodeSocket.getData().length).toBeGreaterThan(0);
        expect(nodeSocket.getData()[0].sender).toStrictEqual("0xB68B9D4f3771c246233823ed1D3Add451055F9Ef");

        nodeSocket.clearData();
        expect(nodeSocket.getData().length).toStrictEqual(0);

        nodeSocket.closeSocket();
        await waitForSocketState(nodeSocket as AlephNodeWebSocket, false);
    });
});
