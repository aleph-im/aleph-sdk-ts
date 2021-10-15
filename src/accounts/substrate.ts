import { Account, ChainType } from "./account";
import { BaseMessage, GetVerificationBuffer } from "../messages/message";

import { Keyring } from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { generateMnemonic } from "@polkadot/util-crypto/mnemonic/bip39";

/**
 * DOTAccount implements the Account class for the substrate protocol.
 *  It is used to represent a substrate account when publishing a message on the Aleph network.
 */
class DOTAccount extends Account {
    private pair: KeyringPair;
    constructor(pair: KeyringPair) {
        const publicKey: string = Buffer.from(pair.publicKey).toString("hex");
        super(pair.address, publicKey);
        this.pair = pair;
    }

    GetChain(): ChainType {
        return ChainType.Substrate;
    }

    /**
     * The Sign method provides a way to sign a given Aleph message using a substrate account.
     * The full message is not used as the payload, only fields of the BaseMessage type are.
     *
     * The sign method of the package 'polkadot' is used as the signature method.
     *
     * @param message The Aleph message to sign, using some of its fields.
     */
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

/**
 * Creates a new substrate account using a randomly generated substrate keyring.
 */
export async function NewAccount(): Promise<DOTAccount> {
    const mnemonic = generateMnemonic();

    return await ImportAccountFromMnemonic(mnemonic);
}

/**
 * Imports a substrate account given a mnemonic and the 'polkadot' package.
 *
 * It creates an substrate wallet containing information about the account, extracted in the DOTAccount constructor.
 *
 * @param mnemonic The mnemonic of the account to import.
 */
export async function ImportAccountFromMnemonic(mnemonic: string): Promise<DOTAccount> {
    const keyRing = new Keyring({ type: "sr25519" });

    await cryptoWaitReady();
    return new DOTAccount(keyRing.createFromUri(mnemonic, { name: "sr25519" }));
}

/**
 * Imports a substrate account given a private key and the 'polkadot/keyring' package's class.
 *
 * It creates a substrate wallet containing information about the account, extracted in the DOTAccount constructor.
 *
 * @param privateKey The private key of the account to import.
 */
export async function ImportAccountFromPrivateKey(privateKey: string): Promise<DOTAccount> {
    const keyRing = new Keyring({ type: "sr25519" });

    await cryptoWaitReady();
    return new DOTAccount(keyRing.createFromUri(privateKey, { name: "sr25519" }));
}
