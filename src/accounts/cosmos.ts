import {
    makeSignDoc,
    OfflineAminoSigner,
    Secp256k1HdWallet,
    Secp256k1HdWalletOptions,
    Secp256k1Wallet,
} from "@cosmjs/amino";
import { Account } from "./account";
import { GetVerificationBuffer } from "../messages";
import { BaseMessage, Chain } from "../messages/message";

export class CosmosAccount extends Account {
    private wallet: OfflineAminoSigner;

    constructor(wallet: OfflineAminoSigner, publicKey: string, address: string) {
        super(address, publicKey);
        this.wallet = wallet;
    }

    GetChain(): Chain {
        return Chain.CSDK;
    }

    async Sign(message: BaseMessage): Promise<string> {
        const buffer = GetVerificationBuffer(message);

        const aminoMsg = {
            type: "signutil/MsgSignText",
            value: {
                message: buffer,
                signer: message.sender,
            },
        };

        const signDoc = makeSignDoc([aminoMsg], { amount: [], gas: "0" }, "signed-message-v1", "0", "0", "0");

        const { signature } = await this.wallet.signAmino(this.address, signDoc);
        const alephSignature = {
            account_number: "0",
            sequence: "0",
            ...signature,
        };

        return JSON.stringify(alephSignature);
    }
}

async function getCosmosAccount(wallet: OfflineAminoSigner): Promise<CosmosAccount> {
    const [account] = await wallet.getAccounts();
    const publicKey = Buffer.from(account.pubkey).toString("hex");

    return new CosmosAccount(wallet, publicKey, account.address);
}

export async function NewAccount(
    length?: 12 | 15 | 18 | 21 | 24,
    options?: Partial<Secp256k1HdWalletOptions>,
): Promise<{ account: CosmosAccount; mnemonic: string }> {
    const wallet = await Secp256k1HdWallet.generate(length, options);

    return {
        account: await getCosmosAccount(wallet),
        mnemonic: wallet.mnemonic,
    };
}

export async function ImportAccountFromMnemonic(
    mnemonic: string,
    options?: Partial<Secp256k1HdWalletOptions>,
): Promise<CosmosAccount> {
    const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, options);

    return getCosmosAccount(wallet);
}

export async function ImportAccountFromPrivateKey(privateKey: string, prefix?: string): Promise<CosmosAccount> {
    const key = Buffer.from(privateKey);
    const wallet = await Secp256k1Wallet.fromKey(key, prefix);

    return getCosmosAccount(wallet);
}
