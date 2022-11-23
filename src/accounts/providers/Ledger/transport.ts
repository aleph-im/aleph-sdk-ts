import Transport from "@ledgerhq/hw-transport";
import { isNode } from "../../../utils/env";

export async function getTransport(): Promise<Transport> {
    let transport;

    if (isNode()) {
        transport = await import("@ledgerhq/hw-transport-node-hid");
    } else {
        transport = await import("@ledgerhq/hw-transport-webusb");
    }

    return await transport.default.create();
}
