import * as bip39 from "bip39";
import { ethers } from "ethers";
import { Account } from "./account";
import { GetVerificationBuffer } from "../messages";
import { BaseMessage, Chain } from "../messages/message";
import { decrypt as secp256k1_decrypt, encrypt as secp256k1_encrypt } from "eciesjs";

/**
 * ETHAccount implements the Account class for the Ethereum protocol.
 * It is used to represent an ethereum account when publishing a message on the Aleph network.
 */
export class ETHAccount extends Account {
    private wallet: ethers.Wallet;
    constructor(wallet: ethers.Wallet) {
        super(wallet.address, wallet.publicKey);
        this.wallet = wallet;
    }

    override GetChain(): Chain {
        return Chain.ETH;
    }

    /**
     * Encrypt a content using the user's public key for an Ethereum account.
     *
     * @param content The content to encrypt.
     * @param as_hex Encrypt the content in hexadecimal.
     */
    encrypt(
        content: string | Buffer,
        { as_hex = true }: { as_hex: boolean } = {
            as_hex: true,
        },
    ): string | Buffer {
        let result: Buffer | string;

        if (typeof content === "string") content = Buffer.from(content);
        result = secp256k1_encrypt(this.publicKey, content);
        if (as_hex) result = result.toString("hex");
        return result;
    }

    /**
     * Decrypt a given content using an ETHAccount.
     *
     * @param encryptedContent The encrypted content to decrypt.
     * @param as_hex Was the content encrypted as hexadecimal ?
     * @param as_string Was the content encrypted as a string ?
     */
    decrypt(
        encryptedContent: Buffer | string,
        { as_hex = true, as_string = true }: { as_hex?: boolean; as_string?: boolean } = {
            as_hex: true,
            as_string: true,
        },
    ): Buffer | string {
        let result: Buffer | string;

        if (as_hex && typeof encryptedContent === "string") encryptedContent = Buffer.from(encryptedContent, "hex");
        else if (typeof encryptedContent === "string") encryptedContent = Buffer.from(encryptedContent);

        const secret = this.wallet.privateKey;
        result = secp256k1_decrypt(secret, encryptedContent);

        if (result === null) throw new Error("could not decrypt");
        if (as_string) result = result.toString();
        return result;
    }

    /**
     * The Sign method provides a way to sign a given Aleph message using an ethereum account.
     * The full message is not used as the payload, only fields of the BaseMessage type are.
     *
     * The signMessage method of the package 'ethers' is used as the signature method.
     *
     * @param message The Aleph message to sign, using some of its fields.
     */
    override Sign(message: BaseMessage): Promise<string> {
        const buffer = GetVerificationBuffer(message);
        return new Promise((resolve) => {
            resolve(this.wallet.signMessage(buffer.toString()));
        });
    }
}

/**
 * Imports an ethereum account given a mnemonic and the 'ethers' package.
 *
 * It creates an ethereum wallet containing information about the account, extracted in the ETHAccount constructor.
 *
 * @param mnemonic The mnemonic of the account to import.
 * @param derivationPath The derivation path used to retrieve the list of accounts attached to the given mnemonic.
 */
export function ImportAccountFromMnemonic(mnemonic: string, derivationPath = "m/44'/60'/0'/0/0"): ETHAccount {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic, derivationPath);

    return new ETHAccount(wallet);
}

/**
 * Imports an ethereum account given a private key and the 'ethers' package.
 *
 * It creates an ethereum wallet containing information about the account, extracted in the ETHAccount constructor.
 *
 * @param privateKey The private key of the account to import.
 */
export function ImportAccountFromPrivateKey(privateKey: string): ETHAccount {
    const wallet = new ethers.Wallet(privateKey);

    return new ETHAccount(wallet);
}

/**
 * Creates a new ethereum account using a generated mnemonic following BIP 39 standard.
 *
 * @param derivationPath
 */
export function NewAccount(derivationPath = "m/44'/60'/0'/0/0"): { account: ETHAccount; mnemonic: string } {
    const mnemonic = bip39.generateMnemonic();

    return { account: ImportAccountFromMnemonic(mnemonic, derivationPath), mnemonic: mnemonic };
}
