import * as bip39 from "bip39";
import * as bip32 from "bip32";
import secp256k1 from "secp256k1";
import { generateMnemonic } from "bip39";
import { Account } from "./account";
import { BaseMessage, Chain } from "../messages/message";
import { GetVerificationBuffer } from "../messages";
import { addressFromHash, magicHash, privateKeyToPublicKey, publicKeyToHash } from "./nuls";
import { decrypt as secp256k1_decrypt, encrypt as secp256k1_encrypt } from "eciesjs";

export type NULS2ImportConfig = {
    chain_id?: number;
    prefix?: string;
};

/**
 *  NULS2Account implements the Account class for the NULS2 protocol.
 *  It is used to represent a NULS2 account when publishing a message on the Aleph network.
 */
export class NULS2Account extends Account {
    private readonly privateKey: string;
    constructor(address: string, publicKey: string, privateKey: string) {
        super(address, publicKey);
        this.privateKey = privateKey;
    }

    GetChain(): Chain {
        return Chain.NULS2;
    }

    /**
     * Encrypt a content using the user's public key for a NULS2 account.
     *
     * @param content The content to encrypt.
     */
    encrypt(content: Buffer): Buffer {
        return secp256k1_encrypt(this.publicKey, content);
    }

    /**
     * Decrypt a given content using a NULS2 account.
     *
     * @param encryptedContent The encrypted content to decrypt.
     */
    decrypt(encryptedContent: Buffer): Buffer {
        const secret = this.privateKey;
        return secp256k1_decrypt(secret, encryptedContent);
    }

    /**
     * The Sign method provides a way to sign a given Aleph message using a NULS2 account.
     * The full message is not used as the payload, only fields of the BaseMessage type are.
     *
     * The message's signature is based on `secp256k1` package.
     *
     * @param message The Aleph message to sign, using some of its fields.
     */
    Sign(message: BaseMessage): Promise<string> {
        const digest = magicHash(GetVerificationBuffer(message));
        const privateKeyBuffer = Buffer.from(this.privateKey, "hex");

        return new Promise((resolve) => {
            const sigObj = secp256k1.ecdsaSign(digest, privateKeyBuffer);
            const signature = this.EncodeSignature(sigObj.signature, sigObj.recid, false);
            resolve(signature.toString("base64"));
        });
    }

    /**
     * Append the recovery of the signature to a signature and compress it if required.
     *
     * @param signature The signature to encode.
     * @param recovery The recovery to append.
     * @param compressed The optional compress flag.
     */
    private EncodeSignature(signature: Uint8Array, recovery: number, compressed: boolean) {
        if (compressed) recovery += 4;
        return Buffer.concat([Buffer.alloc(1, recovery + 27), signature]);
    }
}

/**
 * Creates a new NULS2 account using a randomly generated private key.
 *
 * @param chain_id The optional chain id.
 * @param prefix The optional address prefix.
 */
export async function NewAccount(
    { chain_id = 1, prefix = "NULS" }: NULS2ImportConfig = { chain_id: 1, prefix: "NULS" },
): Promise<{ account: NULS2Account; mnemonic: string }> {
    const mnemonic = generateMnemonic();

    return {
        account: await ImportAccountFromMnemonic(mnemonic, { chain_id: chain_id, prefix: prefix }),
        mnemonic: mnemonic,
    };
}

/**
 * Imports a NULS2 account given a mnemonic.
 *
 * It creates an NULS2 account containing information about the account, extracted in the NULS2Account constructor.
 *
 * @param mnemonic The mnemonic of the account to import.
 * @param chain_id The optional chain id.
 * @param prefix The optional address prefix.
 */
export async function ImportAccountFromMnemonic(
    mnemonic: string,
    { chain_id = 1, prefix = "NULS" }: NULS2ImportConfig = { chain_id: 1, prefix: "NULS" },
): Promise<NULS2Account> {
    const v = await bip39.mnemonicToSeed(mnemonic);
    const b = bip32.fromSeed(v);

    if (!b || !b.privateKey) throw new Error("could not import from mnemonic");
    const privateKey = b.privateKey.toString("hex");
    return ImportAccountFromPrivateKey(privateKey, { chain_id: chain_id, prefix: prefix });
}

/**
 * Imports a NULS2 account given a private key.
 *
 * It creates an NULS2 account containing information about the account, extracted in the NULS2Account constructor.
 *
 * @param privateKey The mnemonic of the account to import.
 * @param chain_id The optional chain id.
 * @param prefix The optional address prefix.
 */
export async function ImportAccountFromPrivateKey(
    privateKey: string,
    { chain_id = 1, prefix = "NULS" }: NULS2ImportConfig = { chain_id: 1, prefix: "NULS" },
): Promise<NULS2Account> {
    const pub = privateKeyToPublicKey(Buffer.from(privateKey, "hex"));
    const publicKey = Buffer.from(pub).toString("hex");

    const hash = publicKeyToHash(pub, { chain_id: chain_id });
    const address = addressFromHash(hash, prefix);
    return new NULS2Account(address, publicKey, privateKey);
}
