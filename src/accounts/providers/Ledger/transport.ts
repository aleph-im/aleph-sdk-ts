import Transport from "@ledgerhq/hw-transport";
import { isNode } from "../../../utils/env";

export async function getTransport(overrideEnvironment?: "node" | "browser"): Promise<Transport> {
    let p: string;

    if (overrideEnvironment) {
        if (overrideEnvironment === "node") {
            p = "@ledgerhq/hw-transport-node-hid";
        } else {
            p = "@ledgerhq/hw-transport-webusb";
        }
    } else {
        if (isNode()) {
            p = "@ledgerhq/hw-transport-node-hid";
        } else {
            p = "@ledgerhq/hw-transport-webusb";
        }
    }

    const transport = await import(p);
    return await transport.default.create();
}
