import {
    DirectSecp256k1HdWallet,
    DirectSecp256k1HdWalletOptions,
    DirectSecp256k1Wallet,
    makeAuthInfoBytes,
    makeSignDoc,
    OfflineDirectSigner,
} from "@cosmjs/proto-signing";
import { Account } from "./account";
import { GetVerificationBuffer } from "../messages";
import { BaseMessage, Chain } from "../messages/message";

export class CosmosAccount extends Account {
    private wallet: OfflineDirectSigner;

    constructor(wallet: OfflineDirectSigner, publicKey: string, address: string) {
        super(address, publicKey);
        this.wallet = wallet;
    }

    GetChain(): Chain {
        return Chain.CSDK;
    }

    async Sign(message: BaseMessage): Promise<string> {
        const buffer = GetVerificationBuffer(message);
        const signer = {
            typeUrl: "signutil/MsgSignText",
            value: buffer,
        };

        const signDoc = makeSignDoc(
            buffer,
            makeAuthInfoBytes([{ pubkey: signer, sequence: 0 }], [], 0),
            "signed-message-v1",
            0,
        );
        const { signature } = await this.wallet.signDirect(this.address, signDoc);

        return JSON.stringify(signature);
    }
}

async function getCosmosAccount(wallet: OfflineDirectSigner): Promise<CosmosAccount> {
    const [account] = await wallet.getAccounts();
    const publicKey = Buffer.from(account.pubkey).toString("hex");

    return new CosmosAccount(wallet, publicKey, account.address);
}

export async function NewAccount(
    length?: 12 | 15 | 18 | 21 | 24,
    options?: Partial<DirectSecp256k1HdWalletOptions>,
): Promise<{ account: CosmosAccount; mnemonic: string }> {
    const wallet = await DirectSecp256k1HdWallet.generate(length, options);

    return {
        account: await getCosmosAccount(wallet),
        mnemonic: wallet.mnemonic,
    };
}

export async function ImportAccountFromMnemonic(
    mnemonic: string,
    options?: Partial<DirectSecp256k1HdWalletOptions>,
): Promise<CosmosAccount> {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, options);

    return getCosmosAccount(wallet);
}

export async function ImportAccountFromPrivateKey(privateKey: string, prefix?: string): Promise<CosmosAccount> {
    const key = Buffer.from(privateKey);
    const wallet = await DirectSecp256k1Wallet.fromKey(key, prefix);

    return getCosmosAccount(wallet);
}
