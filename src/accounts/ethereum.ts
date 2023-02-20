import * as bip39 from "bip39";
import { ethers } from "ethers";
import { ECIESAccount } from "./account";
import { GetVerificationBuffer } from "../messages";
import { BaseMessage, Chain } from "../messages/message";
import { decrypt as secp256k1_decrypt, encrypt as secp256k1_encrypt } from "eciesjs";
import { ChangeRpcParam, JsonRPCWallet, RpcChainType } from "./providers/JsonRPCWallet";
import { BaseProviderWallet } from "./providers/BaseProviderWallet";

import { bufferToHex } from "ethereumjs-util";
import { encrypt } from "@metamask/eth-sig-util";

/**
 * ETHAccount implements the Account class for the Ethereum protocol.
 * It is used to represent an ethereum account when publishing a message on the Aleph network.
 */
export class ETHAccount extends ECIESAccount {
    private wallet?: ethers.Wallet;
    private provider?: BaseProviderWallet;

    constructor(walletOrProvider: ethers.Wallet | BaseProviderWallet, address: string, publicKey: string) {
        super(address, publicKey);

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
     * @param delegateSupport Optional, if you want to encrypt data for another EthAccount (Can also be directly a public key)
     */
    async encrypt(content: Buffer, delegateSupport?: ECIESAccount | string): Promise<Buffer> {
        let publicKey: string;

        // Does the content is encrypted for a tier?
        if (delegateSupport)
            publicKey = delegateSupport instanceof ECIESAccount ? delegateSupport.publicKey : delegateSupport;
        else publicKey = this.publicKey;

        if (publicKey && !this.provider?.isMetamask()) {
            // Wallet encryption method or non-metamask provider
            return new Promise((resolve) => {
                resolve(secp256k1_encrypt(publicKey, content));
            });
        } else {
            // metamask encryption
            return new Promise((resolve) => {
                resolve(
                    Buffer.from(
                        JSON.stringify(
                            encrypt({
                                publicKey: publicKey,
                                data: content.toString(),
                                version: "x25519-xsalsa20-poly1305",
                            }),
                        ),
                        "utf-8",
                    ),
                );
            });
        }
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
            const toDecrypted = this.provider.isMetamask() ? bufferToHex(encryptedContent) : encryptedContent;
            const decrypted = await this.provider.decrypt(toDecrypted);
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
        const buffer = GetVerificationBuffer(message);
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

    return new ETHAccount(wallet, wallet.address, wallet.publicKey);
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

    return new ETHAccount(wallet, wallet.address, wallet.publicKey);
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
 * @param requestedRpc Use this params to change the RPC endpoint;
 */
export async function GetAccountFromProvider(
    provider: ethers.providers.ExternalProvider,
    requestedRpc: ChangeRpcParam = RpcChainType.ETH,
): Promise<ETHAccount> {
    const ETHprovider = new ethers.providers.Web3Provider(provider);
    const jrw = new JsonRPCWallet(ETHprovider);
    await jrw.changeNetwork(requestedRpc);
    await jrw.connect();

    if (jrw.address) return new ETHAccount(jrw, jrw.address, await jrw.getPublicKey());
    throw new Error("Insufficient permissions");
}
