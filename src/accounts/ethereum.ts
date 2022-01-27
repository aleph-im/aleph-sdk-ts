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
     */
    encrypt(content: Buffer): Buffer {
        return secp256k1_encrypt(this.publicKey, content);
    }

    /**
     * Decrypt a given content using an ETHAccount.
     *
     * @param encryptedContent The encrypted content to decrypt.
     */
    decrypt(encryptedContent: Buffer): Buffer {
        const secret = this.wallet.privateKey;
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
