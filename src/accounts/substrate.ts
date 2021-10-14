import { Account, ChainType } from "./account";
import { BaseMessage, GetVerificationBuffer } from "../messages/message";

import { Keyring } from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { generateMnemonic } from "@polkadot/util-crypto/mnemonic/bip39";

class DotAccount extends Account {
    pair: KeyringPair;

    constructor(pair: KeyringPair) {
        const publicKey: string = Buffer.from(pair.publicKey).toString("hex");
        super(pair.address, publicKey);
        this.pair = pair;
    }

    GetChain(): ChainType {
        return ChainType.Substrate;
    }

    Sign(message: BaseMessage): Promise<string> {
        const buffer = GetVerificationBuffer(message);
        return new Promise((resolve) => {
            const signed = `0x${Buffer.from(this.pair.sign(buffer)).toString("hex")}`;

            resolve(
                JSON.stringify({
                    curve: "sr25519",
                    data: signed,
                }),
            );
        });
    }
}

export async function NewAccount(): Promise<DotAccount> {
    const mnemonic = generateMnemonic();

    return await ImportAccountFromMnemonic(mnemonic);
}

export async function ImportAccountFromMnemonic(mnemonic: string): Promise<DotAccount> {
    const keyRing = new Keyring({ type: "sr25519" });

    await cryptoWaitReady();
    return new DotAccount(keyRing.createFromUri(mnemonic, { name: "sr25519" }));
}

export async function ImportAccountFromPrivateKey(privateKey: string): Promise<DotAccount> {
    const keyRing = new Keyring({ type: "sr25519" });

    await cryptoWaitReady();
    return new DotAccount(keyRing.createFromUri(privateKey, { name: "sr25519" }));
}
