import { GetMessagesSocketParams, SocketResponse } from "./getMessagesSocket";

/**
 * This class is used to manipulate Web Socket to list Aleph Messages
 */
export class AlephWebSocket {
    private socket: WebSocket;
    private data: SocketResponse[] = [];

    public isReady: boolean;

    constructor(queryParam: GetMessagesSocketParams, apiServer: string) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        this.isReady = false;
        let queryParamString = "";

        Object.entries(queryParam).forEach(([key, value]) => {
            if (!!value) queryParamString = queryParamString + `&${key}=${value}`;
        });
        if (!!queryParamString) queryParamString = queryParamString.substring(1);
        this.socket = new WebSocket(`${apiServer}/api/ws0/messages?${queryParamString}`);

        // ON OPEN SOCKET
        this.socket.onopen = function (_) {
            console.log("[Aleph-webSocket] Connection established");
            self.isReady = true;
        };

        // ON RECEIVE DATA
        this.socket.onmessage = function (event) {
            self.data.push(JSON.parse(event.data));
        };

        // ON CLOSE SOCKET
        this.socket.onclose = function (event) {
            if (event.wasClean)
                console.log(`[Aleph-webSocket] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            else console.log("[Aleph-webSocket] Connection died");
        };

        // ON ERROR
        this.socket.onerror = function (error) {
            console.log("[Aleph-webSocket]: error: ", error);
        };
    }

    public getData = (): SocketResponse[] => {
        return this.data;
    };

    public getSocket = (): WebSocket => {
        return this.socket;
    };

    public clearData = (): void => {
        this.data = [];
    };

    public closeSocket = (): void => {
        this.socket.close(1000, "Work complete");
    };
}
