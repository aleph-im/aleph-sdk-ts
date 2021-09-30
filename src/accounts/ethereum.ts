import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import { Account, ChainType } from './account';
import { BaseMessage, GetVerificationBuffer } from '../messages/message';

/**
 * ETHAccount implements the Account class for the Ethereum protocol.
 * It is used to represent an ethereum account when publishing a message on the Aleph network.
 */
class ETHAccount extends Account {
    wallet: ethers.Wallet;
    constructor(wallet: ethers.Wallet) {
        super(wallet.address, wallet.publicKey);
        this.wallet = wallet;
    }

    override GetChain(): ChainType {
        return ChainType.Ethereum;
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
export function NewAccount(derivationPath = "m/44'/60'/0'/0/0"): ETHAccount {
    const mnemonic = bip39.generateMnemonic();

    return ImportAccountFromMnemonic(mnemonic, derivationPath);
}
