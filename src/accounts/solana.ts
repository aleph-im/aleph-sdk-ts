import { Account } from "./account";
import { BaseMessage, Chain } from "../messages/message";
import { GetVerificationBuffer } from "../messages";
import * as solanajs from "@solana/web3.js";
import nacl from "tweetnacl";
import base58 from "bs58";

export interface SolanaWallet {
    signMessage(message: Uint8Array): Promise<Uint8Array>;
    publicKey: solanajs.PublicKey;
}

const isKeypair = (keypairOrWallet: solanajs.Keypair | SolanaWallet): keypairOrWallet is solanajs.Keypair =>
    keypairOrWallet.hasOwnProperty("_keypair");

/**
 * SOLAccount implements the Account class for the Solana protocol.
 * It is used to represent a solana account when publishing a message on the Aleph network.
 */
export class SOLAccount extends Account {
    private keypair: solanajs.Keypair | undefined;
    private wallet: SolanaWallet | undefined;

    constructor(keypairOrWallet: solanajs.Keypair | SolanaWallet) {
        super(keypairOrWallet.publicKey.toString(), keypairOrWallet.publicKey.toString());

        if (isKeypair(keypairOrWallet)) {
            this.keypair = keypairOrWallet;
        } else {
            this.wallet = keypairOrWallet;
        }
    }

    override GetChain(): Chain {
        return Chain.SOL;
    }

    /**
     * Put content into a tweetnacl secret box for a solana account.
     *
     * @param content The content to encrypt.
     */
    async encrypt(content: Buffer): Promise<Buffer> {
        if (!this.keypair) throw new Error("Unsupported when used with a wallet");

        const nonce = nacl.randomBytes(nacl.box.nonceLength);
        const encrypt = nacl.box(content, nonce, this.keypair.publicKey.toBytes(), this.keypair.secretKey.slice(0, 32));
        return this.encapsulateBox({ nonce: nonce, ciphertext: encrypt });
    }

    /**
     * Decrypt a given content using a solana account.
     *
     * @param encryptedContent The encrypted content to decrypt.
     */
    async decrypt(encryptedContent: Buffer): Promise<Buffer> {
        if (!this.keypair) throw new Error("Unsupported when used with a wallet");

        const opts = this.decapsulateBox(encryptedContent);
        const result = nacl.box.open(
            opts.ciphertext,
            opts.nonce,
            this.keypair.publicKey.toBytes(),
            this.keypair.secretKey.slice(0, 32),
        );
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
            nonce: content.slice(0, nacl.box.nonceLength),
            ciphertext: content.slice(nacl.box.nonceLength),
        };
    }

    /**
     * The Sign method provides a way to sign a given Aleph message using a solana account.
     * The full message is not used as the payload, only fields of the BaseMessage type are.
     *
     * nacl is used to sign the payload with the account's private key.
     * The final message's signature is composed of the signed payload and the user's public key.
     *
     * @param message The Aleph message to sign, using some of its fields.
     */
    override async Sign(message: BaseMessage): Promise<string> {
        const buffer = GetVerificationBuffer(message);

        // TODO let's clean this up with a proper interface later, this is just for prototyping
        let bufferSignature = !!this.keypair ? nacl.sign.detached(buffer, this.keypair.secretKey) : undefined;
        bufferSignature = !!this.wallet ? await this.wallet.signMessage(buffer) : bufferSignature;

        // This will only happen if the constructor is not used properly
        if (!bufferSignature) throw new Error("Could not sign message");

        return JSON.stringify({
            signature: base58.encode(bufferSignature),
            publicKey: this.publicKey,
        });
    }
}

/**
 * Imports a solana account given a private key and the Keypair solana/web3js package's class.
 *
 * It creates a solana keypair containing information about the account, extracted in the SOLAccount constructor.
 *
 * @param privateKey The private key of the account to import.
 */
export function ImportAccountFromPrivateKey(privateKey: Uint8Array): SOLAccount {
    const keypair: solanajs.Keypair = solanajs.Keypair.fromSecretKey(privateKey);

    return new SOLAccount(keypair);
}

/**
 * Creates a new solana account using a randomly generated solana keypair.
 */
export function NewAccount(): { account: SOLAccount; privateKey: Uint8Array } {
    const account = new solanajs.Keypair();

    return { account: ImportAccountFromPrivateKey(account.secretKey), privateKey: account.secretKey };
}
