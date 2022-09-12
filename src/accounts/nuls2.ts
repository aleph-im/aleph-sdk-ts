import * as bip39 from "bip39";
import * as bip32 from "bip32";
import secp256k1 from "secp256k1";
import { generateMnemonic } from "bip39";
import { Account } from "./account";
import { BaseMessage, Chain } from "../messages/message";
import { GetVerificationBuffer } from "../messages";
import { decrypt as secp256k1_decrypt, encrypt as secp256k1_encrypt } from "eciesjs";
import bs58 from "bs58";
import shajs from "sha.js";
import RIPEMD160 from "ripemd160";

export type ChainNAddress = {
    chain_id?: number;
    address_type?: number;
};

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
    private readonly publicKey: string;

    constructor(address: string, publicKey: string, privateKey: string) {
        super(address);
        this.privateKey = privateKey;
        this.publicKey = publicKey;
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
        return secp256k1_decrypt(this.privateKey, encryptedContent);
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
    const pub = secp256k1.publicKeyCreate(Buffer.from(privateKey, "hex"));
    const publicKey = Buffer.from(pub).toString("hex");

    const hash = publicKeyToHash(pub, { chain_id: chain_id });
    const address = addressFromHash(hash, prefix);
    return new NULS2Account(address, publicKey, privateKey);
}

/********************************
 * NULS2 TOOLS METHODS
 ********************************/

/**
 * Extract an address from a given hash.
 *
 * @param hash The hash containing the address.
 * @param prefix The optional address prefix.
 */
export function addressFromHash(hash: Uint8Array, prefix?: string): string {
    const address = bs58.encode(Buffer.concat([hash, Buffer.from([getXOR(hash)])]));

    if (prefix) return prefix + String.fromCharCode(prefix.length + 96) + address;
    return address;
}

/**
 * Creates a XOR of an array.
 *
 * @param body The array to XOR.
 */
export function getXOR(body: Uint8Array): number {
    return body.reduce((xor, i) => (xor ^= i), 0);
}

/**
 * Creates a hash from a message.
 *
 * @param message The message used to create the hash.
 * @param messagePrefix The optional message's hash prefix.
 */
export function magicHash(message: Buffer, messagePrefix?: string | Buffer): Buffer {
    if (!messagePrefix) messagePrefix = "\u0018NULS Signed Message:\n";
    if (!Buffer.isBuffer(messagePrefix)) messagePrefix = Buffer.from(messagePrefix);

    let buffer = Buffer.allocUnsafe(messagePrefix.length + 6 + message.length);
    let cursor = messagePrefix.copy(buffer, 0);
    cursor += writeVarInt(message.length, buffer, cursor);
    cursor += Buffer.from(message).copy(buffer, cursor);
    buffer = buffer.slice(0, cursor);
    return new shajs.sha256().update(buffer).digest();
}

/**
 * Creates a hash from a user's public key.
 *
 * @param publicKey The public key used to create the hash.
 * @param chain_id The optional chain id.
 * @param address_type The optional address type.
 */
export function publicKeyToHash(
    publicKey: Uint8Array,
    { chain_id = 8964, address_type = 1 }: ChainNAddress = { chain_id: 8964, address_type: 1 },
): Buffer {
    const sha = new shajs.sha256().update(publicKey).digest();
    const publicKeyHash = new RIPEMD160().update(sha).digest();
    const output = Buffer.allocUnsafe(3);

    output.writeInt16LE(chain_id, 0);
    output.writeInt8(address_type, 2);
    return Buffer.concat([output, publicKeyHash]);
}

export function writeVarInt(value: number, buf: Buffer, cursor: number): number {
    let len = 1;

    if (value < 253) {
        buf[cursor] = value;
    } else if (value <= 0xffff) {
        buf[cursor] = 253;
        buf.writeUIntLE(value, cursor + 1, 2);
        len = 3;
    } else if (value <= 0xffffffff) {
        buf[cursor] = 254;
        buf.writeUIntLE(value, cursor + 1, 4);
        len = 5;
    } else {
        throw new Error("not implemented");
    }
    return len;
}
