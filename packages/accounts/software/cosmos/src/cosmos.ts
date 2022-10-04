import {
    makeSignDoc,
    OfflineAminoSigner,
    Secp256k1HdWallet,
    Secp256k1HdWalletOptions,
    Secp256k1Wallet,
} from "@cosmjs/amino";
import { Account, utils, messageType } from "@aleph-sdk-ts/core-base";

export class CosmosAccount extends Account {
    private wallet: OfflineAminoSigner;
    private accountNumber: number;

    constructor(wallet: OfflineAminoSigner, address: string, accountNumber = 0) {
        super(address);
        this.wallet = wallet;
        this.accountNumber = accountNumber;
    }

    GetChain(): messageType.Chain {
        return messageType.Chain.CSDK;
    }

    async Sign(message: messageType.BaseMessage): Promise<string> {
        const buffer = utils.GetVerificationBuffer(message);

        const aminoMsg = {
            type: "signutil/MsgSignText",
            value: {
                message: buffer.toString(),
                signer: message.sender,
            },
        };

        const signDoc = makeSignDoc(
            [aminoMsg],
            { amount: [], gas: "0" },
            "signed-message-v1",
            "",
            this.accountNumber,
            "0",
        );
        const { signature } = await this.wallet.signAmino(this.address, signDoc);

        return JSON.stringify(signature);
    }
}

async function getCosmosAccount(wallet: OfflineAminoSigner, accountNumber = 0): Promise<CosmosAccount> {
    const accounts = await wallet.getAccounts();
    try {
        const account = accounts[accountNumber];
        return new CosmosAccount(wallet, account.address, accountNumber);
    } catch (err) {
        throw new RangeError("Account offset out of bound");
    }
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
