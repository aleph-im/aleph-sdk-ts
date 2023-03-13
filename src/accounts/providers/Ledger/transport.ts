import Transport from "@ledgerhq/hw-transport";
import { isNode, JSExecutionEnvironment } from "../../../utils/env";

export async function getTransport(overrideEnvironment?: JSExecutionEnvironment): Promise<Transport> {
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
