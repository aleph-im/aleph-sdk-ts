import Transport from "@ledgerhq/hw-transport";
import { isNode, JSExecutionEnvironment } from "../../../utils/env";

export async function getTransport(overrideEnvironment?: JSExecutionEnvironment): Promise<Transport> {
    let transport;

    if (
        overrideEnvironment === "node" ||
        (isNode() && overrideEnvironment !== "browser" && overrideEnvironment !== undefined)
    ) {
        transport = await import("@ledgerhq/hw-transport-node-hid");
    } else {
        transport = await import("@ledgerhq/hw-transport-webusb");
    }

    return await transport.default.create();
}
