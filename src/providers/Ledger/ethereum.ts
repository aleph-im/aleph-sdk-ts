import EthApp from "@ledgerhq/hw-app-eth";

import { Account } from "../../accounts/account";
import { Chain, BaseMessage } from "../../messages/message";
import { GetVerificationBuffer } from "../../messages";
import { getTransport } from "./transport";

const DERIVATION_PATH = "44'/60'/0'/0/0";

class ETHLedgerAccount extends Account {
    private signer: EthApp;

    constructor(signer: EthApp, address: string) {
        super(address);
        this.signer = signer;
    }

    GetChain(): Chain {
        return Chain.ETH;
    }

    private async getSignature(input: Buffer) {
        const rsv = await this.signer.signPersonalMessage(DERIVATION_PATH, input.toString("hex"));
        const { r, s } = rsv;
        const v = Number(rsv.v - 27)
            .toString(16)
            .padStart(2, "0");

        return `0x${r}${s}${v}`;
    }

    async Sign(message: BaseMessage): Promise<string> {
        const buf = GetVerificationBuffer(message);
        return this.getSignature(buf);
    }
}

/**
 * This method retrieves an Ethereum account from a connected Ledger device
 */
export async function GetAccountFromLedger(): Promise<ETHLedgerAccount> {
    const transport = await getTransport();
    const signer = new EthApp(transport);

    const { version } = await signer.getAppConfiguration();
    const stripPatch = Number(version.replace(/(\w+\.\w+)\.\w+$/gi, "$1"));
    if (stripPatch < 1.9) {
        throw new Error("Outdated Ledger device firmware. PLease update");
    }

    const { address } = await signer.getAddress(DERIVATION_PATH);

    return new ETHLedgerAccount(signer, address);
}
