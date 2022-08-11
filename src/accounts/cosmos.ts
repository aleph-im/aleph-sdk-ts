import { DirectSecp256k1HdWallet, DirectSecp256k1HdWalletOptions, DirectSecp256k1Wallet } from "@cosmjs/proto-signing";
import * as bip39 from "bip39";
import { Account } from "./account";
import { GetVerificationBuffer } from "../messages";
import { BaseMessage, Chain } from "../messages/message";

type DirectWallet = DirectSecp256k1Wallet | DirectSecp256k1HdWallet;

export class CosmosAccount extends Account {
    private wallet: DirectWallet;

    constructor(wallet: DirectWallet, publicKey: string, address: string) {
        super(address, publicKey);
        this.wallet = wallet;
    }

    GetChain(): Chain {
        return Chain.CSDK;
    }

    async Sign(message: BaseMessage): Promise<string> {
        const buffer = GetVerificationBuffer(message);
        // TODO
    }
}

async function getAddressAndPublicKey(wallet: DirectWallet) {
    const [account] = await wallet.getAccounts();
    const publicKey = Buffer.from(account.pubkey).toString("hex");

    return { address: account.address, publicKey };
}

export async function NewAccount(): Promise<CosmosAccount> {
    const mnemonic = bip39.generateMnemonic();
    return ImportAccountFromMnemonic(mnemonic);
}

export async function ImportAccountFromMnemonic(
    mnemonic: string,
    options?: Partial<DirectSecp256k1HdWalletOptions>,
): Promise<CosmosAccount> {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, options);
    const { address, publicKey } = await getAddressAndPublicKey(wallet);

    return new CosmosAccount(wallet, publicKey, address);
}

export async function ImportAccountFromPrivateKey(privateKey: string, prefix?: string): Promise<CosmosAccount> {
    const key = Buffer.from(privateKey);
    const wallet = await DirectSecp256k1Wallet.fromKey(key, prefix);
    const { address, publicKey } = await getAddressAndPublicKey(wallet);

    return new CosmosAccount(wallet, publicKey, address);
}
