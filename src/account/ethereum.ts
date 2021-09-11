import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import { Account } from './account';

class ETHAccount extends Account {
    constructor(wallet: ethers.Wallet) {
        super(wallet.address, wallet.publicKey);
    }
}

export function ImportAccountFromMnemonic(mnemonic: string, derivationPath = "m/44'/60'/0'/0/0"): ETHAccount {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic, derivationPath);

    return new ETHAccount(wallet);
}

export function ImportAccountFromPrivateKey(privateKey: string): ETHAccount {
    const wallet = new ethers.Wallet(privateKey);

    return new ETHAccount(wallet);
}

export function NewAccount(derivationPath = "m/44'/60'/0'/0/0"): ETHAccount {
    const mnemonic = bip39.generateMnemonic();

    return ImportAccountFromMnemonic(mnemonic, derivationPath);
}
