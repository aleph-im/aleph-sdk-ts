import * as bip39 from "bip39";
import { ethers } from "ethers";
import { Account } from "@aleph-sdk-ts/core-base/dist/types/account";
import { utils } from "@aleph-sdk-ts/core-base";
import { Chain, BaseMessage } from "@aleph-sdk-ts/core-base/dist/types/messages";
import { decrypt as secp256k1_decrypt, encrypt as secp256k1_encrypt } from "eciesjs";
import { BaseProviderWallet, JsonRPCWallet } from "@aleph-sdk-ts/core-providers";

/**
 * ETHAccount implements the Account class for the Ethereum protocol.
 * It is used to represent an ethereum account when publishing a message on the Aleph network.
 */
export class ETHAccount extends Account {
    private wallet?: ethers.Wallet;
    private provider?: BaseProviderWallet;

    constructor(walletOrProvider: ethers.Wallet | BaseProviderWallet, address: string) {
        super(address);

        if (walletOrProvider instanceof ethers.Wallet) this.wallet = walletOrProvider;
        else this.provider = walletOrProvider;
    }

    override GetChain(): Chain {
        return Chain.ETH;
    }

    /**
     * Encrypt a content using the user's public key for an Ethereum account.
     *
     * @param content The content to encrypt.
     */
    async encrypt(content: Buffer): Promise<Buffer> {
        const publicKey = this.wallet?.publicKey || (await this.provider?.getPublicKey());
        if (publicKey) return secp256k1_encrypt(publicKey, content);

        throw new Error("Cannot encrypt content");
    }

    /**
     * Decrypt a given content using an ETHAccount.
     *
     * @param encryptedContent The encrypted content to decrypt.
     */
    async decrypt(encryptedContent: Buffer): Promise<Buffer> {
        if (this.wallet) {
            const secret = this.wallet.privateKey;
            return secp256k1_decrypt(secret, encryptedContent);
        }
        if (this.provider) {
            const decrypted = await this.provider.decrypt(encryptedContent);
            return Buffer.from(decrypted);
        }
        throw new Error("Cannot encrypt content");
    }

    /**
     * The Sign method provides a way to sign a given Aleph message using an ethereum account.
     * The full message is not used as the payload, only fields of the BaseMessage type are.
     *
     * The signMessage method of the package 'ethers' is used as the signature method.
     *
     * @param message The Aleph message to sign, using some of its fields.
     */
    async Sign(message: BaseMessage): Promise<string> {
        const buffer = utils.GetVerificationBuffer(message);
        const signMethod = this.wallet || this.provider;

        if (signMethod) return signMethod.signMessage(buffer.toString());

        throw new Error("Cannot sign message");
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

    return new ETHAccount(wallet, wallet.address);
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

    return new ETHAccount(wallet, wallet.address);
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

/**
 * Get an account from a Web3 provider (ex: Metamask)
 *
 * @param  {ethers.providers.ExternalProvider} provider
 */
export async function GetAccountFromProvider(provider: ethers.providers.ExternalProvider) {
    const ETHprovider = new ethers.providers.Web3Provider(provider);
    const jrw = new JsonRPCWallet(ETHprovider);
    await jrw.connect();

    if (jrw.address) return new ETHAccount(jrw, jrw.address);
    throw new Error("Insufficient permissions");
}
