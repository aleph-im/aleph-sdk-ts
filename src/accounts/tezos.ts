import { Account } from "./account";
import { BaseMessage, Chain } from "../messages/message";
import { GetVerificationBuffer } from "../messages";
import { InMemorySigner } from "@taquito/signer";
import { verifySignature, validateKeyHash, getPkhfromPk } from "@taquito/utils";

import nacl from "tweetnacl";
import base58 from "bs58";

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
     * Put content into a tweetnacl secret box for a solana account.
     *
     * @param content The content to encrypt.
     */
    async encrypt(content: Buffer): Promise<Buffer> {
        const pkey = base58.decode(this.publicKey);
        const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
        const encrypt = nacl.secretbox(content, nonce, pkey);
        return this.encapsulateBox({ nonce: nonce, ciphertext: encrypt });
    }

    /**
     * Decrypt a given content using a solana account.
     *
     * @param encryptedContent The encrypted content to decrypt.
     */
    async decrypt(encryptedContent: Buffer): Promise<Buffer> {
        const opts = this.decapsulateBox(encryptedContent);
        const pkey = base58.decode(this.publicKey);
        const result = nacl.secretbox.open(opts.ciphertext, opts.nonce, pkey);
        if (result === null) throw new Error("could not decrypt");
        return Buffer.from(result);
    }

    /**
     * Concat the nonce with the secret box content into a single Buffer.
     * @param opts contain the nonce used during box creation and the result of the box in ciphertext.
     * @private
     */
    private encapsulateBox(opts: { nonce: Uint8Array; ciphertext: Uint8Array }): Buffer {
        if (!opts.nonce) {
            throw new Error("No nonce found");
        }
        return Buffer.concat([opts.nonce, opts.ciphertext]);
    }

    /**
     * Decomposed the result of the Solana's Encrypt method to be interpreted in Decrypt method.
     * @param content, A concatenation of a nonce and a Buffer used for creating a box.
     * @private
     */
    private decapsulateBox(content: Buffer): { nonce: Buffer; ciphertext: Buffer } {
        return {
            nonce: content.slice(0, nacl.secretbox.nonceLength),
            ciphertext: content.slice(nacl.secretbox.nonceLength),
        };
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
 * Imports an solana account given a private key and the Keypair solana/web3js package's class.
 *
 * It creates an solana wallet containing information about the account, extracted in the SOLAccount constructor.
 *
 * @param privateKey The private key of the account to import.
 */
export function ImportAccountFromPrivateKey(privateKey: Uint8Array): XTZAccount {
    const wallet: InMemorySigner = new InMemorySigner(privateKey);

    return new XTZAccount(wallet);
}

/**
 * Creates a new Tezos account using a randomly generated Tezos keypair.
 */
export function NewAccount(): { account: XTZAccount; privateKey: Uint8Array } {
    const account = new InMemorySigner();

    return { account: ImportAccountFromPrivateKey(account.secretKey), privateKey: account.secretKey };
}
