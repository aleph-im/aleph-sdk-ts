import bs58 from "bs58";
import shajs from "sha.js";
import * as bip32 from "bip32";
import * as bip39 from "bip39";
import RIPEMD160 from "ripemd160";
import secp256k1 from "secp256k1";
import { Account, ChainType } from "./account";
import { BaseMessage, GetVerificationBuffer } from "../messages/message";

export const hexRegEx = /([0-9]|[a-f])/gim;
export type ChainNAddress = {
    chain_id?: number;
    address_type?: number;
};
export type NULSImportConfig = {
    chain_id?: number;
    prefix?: string;
};

/**
 *  NULSAccount implements the Account class for the NULS protocol.
 *  It is used to represent a NULS account when publishing a message on the Aleph network.
 */
class NULSAccount extends Account {
    private readonly privateKey: string;
    constructor(address: string, publicKey: string, privateKey: string) {
        super(address, publicKey);
        this.privateKey = privateKey;
    }

    GetChain(): ChainType {
        return ChainType.NULS;
    }

    /**
     * The Sign method provides a way to sign a given Aleph message using a NULS account.
     * The full message is not used as the payload, only fields of the BaseMessage type are.
     *
     * The message's signature is based on `secp256k1` package.
     *
     * @param message The Aleph message to sign, using some of its fields.
     */
    Sign(message: BaseMessage): Promise<string> {
        const privateKeyBuffer = Buffer.from(this.privateKey, "hex");
        const digest = magicHash(GetVerificationBuffer(message));
        const publicKeyBuffer = privateKeyToPublicKey(privateKeyBuffer);

        return new Promise<string>((resolve) => {
            const sigObj = secp256k1.ecdsaSign(digest, privateKeyBuffer);
            const signed = secp256k1.signatureExport(sigObj.signature);

            const buf = Buffer.alloc(3 + publicKeyBuffer.length + signed.length);
            let cursor = writeWithLength(publicKeyBuffer, buf, 0);
            cursor += 1; // we let a zero there for alg ECC type
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            cursor += writeWithLength(signed, buf, cursor);
            resolve(buf.toString("hex"));
        });
    }
}

/**
 * Creates a new NULS account using a randomly generated private key.
 *
 * @param chain_id The optional chain id
 * @param prefix The optional address prefix
 */
export async function NewAccount(
    { chain_id = 1, prefix = "" }: NULSImportConfig = { chain_id: 1, prefix: "" },
): Promise<{ account: NULSAccount; mnemonic: string }> {
    const mnemonic = bip39.generateMnemonic();

    return {
        account: await ImportAccountFromMnemonic(mnemonic, { chain_id: chain_id, prefix: prefix }),
        mnemonic: mnemonic,
    };
}

/**
 * Imports a NULS account given a mnemonic.
 *
 * It creates an NULS account containing information about the account, extracted in the NULSAccount constructor.
 *
 * @param mnemonic The mnemonic of the account to import.
 * @param chain_id The optional chain id
 * @param prefix The optional address prefix
 */
export async function ImportAccountFromMnemonic(
    mnemonic: string,
    { chain_id = 1, prefix = "" }: NULSImportConfig = { chain_id: 1, prefix: "" },
): Promise<NULSAccount> {
    const v = await bip39.mnemonicToSeed(mnemonic);
    const b = bip32.fromSeed(v);

    if (!b || !b.privateKey) throw new Error("could not import from mnemonic");
    const privateKey = b.privateKey.toString("hex");
    return ImportAccountFromPrivateKey(privateKey, { chain_id: chain_id, prefix: prefix });
}

/**
 * Imports a NULS account given a private key.
 *
 * It creates an NULS account containing information about the account, extracted in the NULSAccount constructor.
 *
 * @param privateKey The mnemonic of the account to import.
 * @param chain_id The optional chain id
 * @param prefix The optional address prefix
 */
export async function ImportAccountFromPrivateKey(
    privateKey: string,
    { chain_id = 1, prefix = "" }: NULSImportConfig = { chain_id: 1, prefix: "" },
): Promise<NULSAccount> {
    const pub = privateKeyToPublicKey(Buffer.from(privateKey, "hex"));
    const publicKey = Buffer.from(pub).toString("hex");

    const hash = publicKeyToHash(pub, { chain_id: chain_id });
    const address = addressFromHash(hash, prefix);
    return new NULSAccount(address, publicKey, privateKey);
}

/**
 * Creates a XOR of an array
 *
 * @param body The array to XOR
 */
export function getXOR(body: Uint8Array): number {
    let xor = 0;

    for (let i = 0; i < body.length; i += 1) {
        xor ^= body[i];
    }
    return xor;
}

/**
 * Creates a hash from a message
 *
 * @param message The message used to create the hash
 * @param messagePrefix The optional message's hash prefix
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
 * Extracts a public key from a given private key
 *
 * @param privateKey The private key to extract from
 */
export function privateKeyToPublicKey(privateKey: Uint8Array): Uint8Array {
    return secp256k1.publicKeyCreate(privateKey);
}

/**
 * Creates a hash from a user's public key
 *
 * @param publicKey The public key used to create the hash
 * @param chain_id The optional chain id
 * @param address_type The optional address type
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

/**
 * Extract an address from a given hash
 *
 * @param hash The hash containing the address
 * @param prefix The optional address prefix
 */
export function addressFromHash(hash: Uint8Array, prefix?: string): string {
    const address = bs58.encode(Buffer.concat([hash, Buffer.from([getXOR(hash)])]));

    if (prefix) return prefix + String.fromCharCode(prefix.length + 96) + address;
    return address;
}

/**
 * Extract a hash from a given user's address
 *
 * @param address The address used to produce the hash
 */
export function hashFromAddress(address: string): Buffer {
    const hash = bs58.decode(address);

    return hash.slice(0, hash.length - 1);
}

/**
 * Performs a hash operation on a buffer, twice
 *
 * @param buffer The buffer to hash twice
 */
export function hashTwice(buffer: Buffer): Buffer {
    let sha = new shajs.sha256().update(buffer).digest();

    sha = new shajs.sha256().update(sha).digest();
    return sha;
}

/**
 * Verify if an input is in string hexadecimal format
 *
 * @param input The input to verify
 */
export function isHex<T>(input: T): boolean {
    return typeof input === "string" && (input.match(hexRegEx) || []).length === input.length;
}

/**
 * Verify if a given private key is valid
 *
 * @param private_key The private key to verify
 */
export function checkPrivateKey(private_key: string): boolean {
    if (!isHex(private_key)) return false;
    if (!private_key) return false;
    if (private_key.length === 66 && private_key.substring(0, 2) === "00") private_key = private_key.substring(2, 66);
    if (private_key.length !== 64) return false;
    try {
        const privateKeyBuffer = Buffer.from(private_key, "hex");
        privateKeyToPublicKey(privateKeyBuffer);
    } catch (e) {
        return false;
    }
    return true;
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

export function writeWithLength(val: Uint8Array, buf: Buffer, cursor: number): number {
    const llen = writeVarInt(val.length, buf, cursor);
    const vBuf = Buffer.from(val);
    const slen = vBuf.copy(buf, cursor + llen);

    return llen + slen;
}
