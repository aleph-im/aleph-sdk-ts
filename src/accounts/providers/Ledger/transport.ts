import Transport from "@ledgerhq/hw-transport";
import { isNode } from "../../../utils/env";

export async function getTransport(overrideEnvironment?: "node" | "browser"): Promise<Transport> {
    let p = "webusb";

    if (
        overrideEnvironment === "node" ||
        (isNode() && overrideEnvironment !== "browser" && overrideEnvironment !== undefined)
    ) {
        p = "node-hid";
    }

    const transport = await import(`@ledgerhq/hw-transport-${p}`);
    return await transport.default.create();
}
