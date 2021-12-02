import { Account } from "./account";
import { BaseMessage, Chain } from "../messages/message";
import { GetVerificationBuffer } from "../messages";
import * as solanajs from "@solana/web3.js";
import nacl from "tweetnacl";
import base58 from "bs58";

/**
 * SOLAccount implements the Account class for the Solana protocol.
 * It is used to represent an solana account when publishing a message on the Aleph network.
 */
export class SOLAccount extends Account {
    private wallet: solanajs.Keypair;

    constructor(wallet: solanajs.Keypair) {
        super(wallet.publicKey.toString(), wallet.publicKey.toString());
        this.wallet = wallet;
    }

    override GetChain(): Chain {
        return Chain.SOL;
    }

    /**
     * Put content into a tweetnacl secret box for a solana account.
     * THIS ENCRYPTION IS NOT SAFE as the nonce is returned by the function.
     *
     * @param content The content to encrypt.
     * @param as_hex Encrypt the content in hexadecimal.
     */
    async encrypt(
        content: string | Buffer,
        { as_hex = true }: { as_hex: boolean } = {
            as_hex: true,
        },
    ): Promise<string | Buffer> {
        let res: string | Buffer;

        if (typeof content === "string") content = Buffer.from(content);
        const pkey = base58.decode(this.publicKey);
        const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
        const encrypt = nacl.secretbox(content, nonce, pkey);
        res = this.encapsulateBox({ nonce: nonce, ciphertext: encrypt });
        if (as_hex) res = res.toString("hex");
        return res;
    }

    /**
     * Decrypt a given content using a solana account.
     *
     * @param encryptedContent The encrypted content to decrypt.
     * @param as_hex Was the content encrypted as hexadecimal ?
     * @param as_string Was the content encrypted as a string ?
     */
    async decrypt(
        encryptedContent: Buffer | string,
        { as_hex = true, as_string = true }: { as_hex?: boolean; as_string?: boolean } = {
            as_hex: true,
            as_string: true,
        },
    ): Promise<Buffer | string | Uint8Array> {
        if (as_hex && typeof encryptedContent === "string") encryptedContent = Buffer.from(encryptedContent, "hex");
        else if (typeof encryptedContent === "string") encryptedContent = Buffer.from(encryptedContent);
        let result: Buffer | Uint8Array | string | null;

        const opts = this.decapsulateBox(encryptedContent);
        const pkey = base58.decode(this.publicKey);
        result = nacl.secretbox.open(opts.ciphertext, opts.nonce, pkey);
        if (result === null) throw new Error("could not decrypt");
        if (as_string) result = Buffer.from(result).toString();
        return result;
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
     * The Sign method provides a way to sign a given Aleph message using an solana account.
     * The full message is not used as the payload, only fields of the BaseMessage type are.
     *
     * nacl is used to sign the payload with the account's private key.
     * The final message's signature is composed of the signed payload and the user's public key.
     *
     * @param message The Aleph message to sign, using some of its fields.
     */
    override Sign(message: BaseMessage): Promise<string> {
        const buffer = GetVerificationBuffer(message);

        return new Promise((resolve) => {
            const bufferSignature = nacl.sign.detached(buffer, this.wallet.secretKey);

            resolve(
                JSON.stringify({
                    signature: base58.encode(bufferSignature),
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
export function ImportAccountFromPrivateKey(privateKey: Uint8Array): SOLAccount {
    const wallet: solanajs.Keypair = solanajs.Keypair.fromSecretKey(privateKey);

    return new SOLAccount(wallet);
}

/**
 * Creates a new solana account using a randomly generated solana keypair.
 */
export function NewAccount(): { account: SOLAccount; privateKey: Uint8Array } {
    const account = new solanajs.Keypair();

    return { account: ImportAccountFromPrivateKey(account.secretKey), privateKey: account.secretKey };
}
