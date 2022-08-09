import { Account } from "./account";
import { BaseMessage, Chain } from "../messages/message";
import { GetVerificationBuffer } from "../messages";
import { InMemorySigner } from "@taquito/signer";
import { b58cdecode, b58cencode, prefix } from "@taquito/utils";
import { getPkhfromPk } from "@taquito/utils";

import nacl from "tweetnacl";

/**
 * XTZAccount implements the Account class for the Tezos protocol.
 * It is used to represent a Tezos account when publishing a message on the Aleph network.
 */
export class XTZAccount extends Account {
    private signer: InMemorySigner;

    /**
     * @param publicKey The public key encoded in base58.
     * @param signer The signer containing the private key used to sign the message.
     */
    constructor(publicKey: string, signer: InMemorySigner) {
        super(getPkhfromPk(publicKey), publicKey);
        this.signer = signer;
    }

    override GetChain(): Chain {
        return Chain.XTZ;
    }

    /**
     * The Sign method provides a way to sign a given Aleph message using a Tezos account.
     * The full message is not used as the payload, only fields of the BaseMessage type are.
     *
     * nacl is used to sign the payload with the account's private key.
     * The final message's signature is composed of the signed payload and the user's public key.
     *
     * @param message The Aleph message to sign, using some of its fields.
     */
    override async Sign(message: BaseMessage): Promise<string> {
        const buffer = GetVerificationBuffer(message);

        return new Promise(async (resolve) => {
            const bufferSignature = await this.signer.sign(buffer.toString("hex"));

            resolve(
                JSON.stringify({
                    signature: bufferSignature.sig,
                    publicKey: this.publicKey,
                }),
            );
        });
    }
}

/**
 * Imports a Tezos account given a private key, using the @taquito/signer InMemorySigner class.
 *
 * @param privateKey The private key of the account to import.
 * @param passphrase The password, if the key is encrypted.
 */
export async function ImportAccountFromPrivateKey(privateKey: string, passphrase?: string): Promise<XTZAccount> {
    const wallet: InMemorySigner = new InMemorySigner(privateKey, passphrase);

    return new XTZAccount(await wallet.publicKeyHash(), wallet);
}

/**
 * Imports a Tezos account given fundraiser information, using the @taquito/signer InMemorySigner class.
 *
 * @param email The email used.
 * @param password The password used.
 * @param mnemonic The mnemonic received during the fundraiser.
 */
export async function ImportAccountFromFundraiserInfo(
    email: string,
    password: string,
    mnemonic: string,
): Promise<XTZAccount> {
    const wallet: InMemorySigner = await InMemorySigner.fromFundraiser(email, password, mnemonic);

    return new XTZAccount(await wallet.publicKeyHash(), wallet);
}

/**
 * Creates a new Tezos account (tz1) using a randomly generated Tezos keypair.
 */
export async function NewAccount(): Promise<{ account: XTZAccount; privateKey: Uint8Array }> {
    const key = b58cencode(nacl.sign.keyPair().secretKey, prefix.edsk);
    const wallet = await ImportAccountFromPrivateKey(key);

    return {
        account: wallet,
        privateKey: b58cdecode(key, prefix.edsk),
    };
}
