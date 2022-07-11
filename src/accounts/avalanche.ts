import shajs from "sha.js";
import { Account } from "./account";
import { GetVerificationBuffer } from "../messages";
import { BaseMessage, Chain } from "../messages/message";
import { decrypt as secp256k1_decrypt, encrypt as secp256k1_encrypt } from "eciesjs";
import { KeyPair } from "avalanche/dist/apis/avm";
import { Avalanche, BinTools, Buffer as AvaBuff } from "avalanche";

/**
 * AvalancheAccount implements the Account class for the Avalanche protocol.
 * It is used to represent an Avalanche account when publishing a message on the Aleph network.
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

    private async digestMessage(message: Buffer) {
        const msgSize = Buffer.alloc(4);
        msgSize.writeUInt32BE(message.length, 0);
        const msgStr = message.toString("utf-8");
        const msgBuf = Buffer.from(`\x1AAvalanche Signed Message:\n${msgSize}${msgStr}`, "utf8");

        return new shajs.sha256().update(msgBuf).digest();
    }

    /**
     * The Sign method provides a way to sign a given Aleph message using an avalanche keypair.
     * The full message is not used as the payload, only fields of the BaseMessage type are.
     *
     * The sign method of the keypair is used as the signature method.
     *
     * @param message The Aleph message to sign, using some of its fields.
     */
    async Sign(message: BaseMessage): Promise<string> {
        const buffer = GetVerificationBuffer(message);
        const digest = await this.digestMessage(buffer);

        const digestHex = digest.toString("hex");
        const digestBuff = AvaBuff.from(digestHex, "hex");

        return this.signer.sign(digestBuff).toString();
    }
}

async function getKeyChain() {
    const ava = new Avalanche();
    const xChain = ava.XChain();

    return xChain.keyChain();
}

export async function getKeyPair(privateKey?: string): Promise<KeyPair> {
    const keyChain = await getKeyChain();
    const keyPair = keyChain.makeKey();

    if (privateKey) {
        let keyBuff: AvaBuff;
        if (privateKey.startsWith("PrivateKey-")) {
            const bintools = BinTools.getInstance();
            keyBuff = bintools.cb58Decode(privateKey.split("-")[1]);
        } else {
            keyBuff = AvaBuff.from(privateKey, "hex");
        }
        if (keyPair.importKey(keyBuff)) return keyPair;
        throw new Error("Invalid private key");
    }
    return keyPair;
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
 * Creates a new Avalanche account using a randomly generated privateKey
 *
 */
export async function NewAccount(): Promise<{ account: AvalancheAccount; privateKey: string }> {
    const keypair = await getKeyPair();
    const privateKey = keypair.getPrivateKey().toString("hex");

    return { account: new AvalancheAccount(keypair), privateKey };
}
