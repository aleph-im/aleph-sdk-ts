import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import { Account, ChainType } from './account';
import { BaseMessage, GetVerificationBuffer } from '../messages/message';

class ETHAccount extends Account {
    wallet: ethers.Wallet;
    constructor(wallet: ethers.Wallet) {
        super(wallet.address, wallet.publicKey);
        this.wallet = wallet;
    }

    override GetChain(): ChainType {
        return ChainType.Ethereum;
    }

    override Sign(message: BaseMessage): Promise<string> {
        const buffer = GetVerificationBuffer(message);
        return new Promise((resolve) => {
            resolve(this.wallet.signMessage(buffer.toString()));
        });
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
