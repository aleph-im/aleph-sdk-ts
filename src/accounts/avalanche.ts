import * as bip39 from "bip39";
import * as bip32 from "bip32";
import shajs from "sha.js";
import { Account } from "./account";
import { GetVerificationBuffer } from "../messages";
import { BaseMessage, Chain } from "../messages/message";
import { decrypt as secp256k1_decrypt, encrypt as secp256k1_encrypt } from "eciesjs";
import Avalanche from "avalanche";
import { KeyPair } from "avalanche/dist/apis/avm";

/**
 * AvalancheAccount implements the Account class for the Ethereum protocol.
 * It is used to represent an ethereum account when publishing a message on the Aleph network.
 */
export class AvalancheAccount extends Account {
    private signer;

    constructor(signer: KeyPair) {
        super(signer.getAddress().toString("hex"), signer.getPublicKey().toString("hex"));
        this.signer = signer;
    }

    override GetChain(): Chain {
        return Chain.AVAX;
    }

    /**
     * Encrypt a content using the user's public key from the keypair
     *
     * @param content The content to encrypt.
     */
    encrypt(content: Buffer): Buffer {
        return secp256k1_encrypt(this.publicKey, content);
    }

    /**
     * Decrypt a given content using the private key from the keypair.
     *
     * @param encryptedContent The encrypted content to decrypt.
     */
    decrypt(encryptedContent: Buffer): Buffer {
        const secret = this.signer.getPrivateKey().toString("hex");
        return secp256k1_decrypt(secret, encryptedContent);
    }

    /**
     * The Sign method provides a way to sign a given Aleph message using an ethereum account.
     * The full message is not used as the payload, only fields of the BaseMessage type are.
     *
     * The signMessage method of the package 'ethers' is used as the signature method.
     *
     * @param message The Aleph message to sign, using some of its fields.
     */

    private async digestMessage(message: Buffer) {
        const msgSize = Buffer.alloc(4);
        msgSize.writeUInt32BE(message.length, 0);
        const msgStr = message.toString("utf-8");
        const msgBuf = Buffer.from(`\x1AAvalanche Signed Message:\n${msgSize}${msgStr}`, "utf8");

        return new shajs.sha256().update(msgBuf).digest();
    }

    async Sign(message: BaseMessage): Promise<string> {
        const buffer = GetVerificationBuffer(message);
        const digest = await this.digestMessage(buffer);

        const digestHex = digest.toString("hex");
        const digestBuff = Buffer.from(digestHex, "hex");

        return this.signer.sign(digestBuff);
    }
}

async function getKeyChain() {
    const ava = new Avalanche();
    const xChain = ava.XChain();

    return xChain.keyChain();
}

async function getKeyPair(privateKey: string) {
    const keyChain = await getKeyChain();
    const keyPair = keyChain.makeKey();
    const keyBuff = Buffer.from(privateKey, "hex");

    if (keyPair.importKey(keyBuff)) return keyPair;
    throw new Error("Invalid private key");
}

/**
 * Imports an avalanche account given a mnemonic.
 *
 * It creates an avalanche keypair containing information about the account, extracted in the AvalancheAccount constructor.
 *
 * @param mnemonic The mnemonic of the account to import.
 */
export async function ImportAccountFromMnemonic(mnemonic: string): Promise<AvalancheAccount> {
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const bip32I = bip32.fromSeed(seed);

    const privateKey = bip32I?.privateKey;
    if (privateKey) return ImportAccountFromPrivateKey(privateKey.toString("hex"));

    throw new Error("Could not get private key from mnemonic");
}

/**
 * Imports an Avalanche account given a private key.
 *
 * It creates an Avalanche keypair containing information about the account, extracted in the AvalancheAccount constructor.
 *
 * @param privateKey The private key of the account to import.
 */
export async function ImportAccountFromPrivateKey(privateKey: string): Promise<AvalancheAccount> {
    const keyPair = await getKeyPair(privateKey);
    return new AvalancheAccount(keyPair);
}

/**
 * Creates a new Avalanche account using a generated mnemonic following BIP 39 standard.
 *
 * @param derivationPath
 */
export async function NewAccount(): Promise<{ account: AvalancheAccount; mnemonic: string }> {
    const mnemonic = bip39.generateMnemonic();
    return { account: await ImportAccountFromMnemonic(mnemonic), mnemonic };
}
