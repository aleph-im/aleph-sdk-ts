import { Account, ChainType } from './account';
import { BaseMessage, GetVerificationBuffer } from '../messages/message';
import * as solanajs from '@solana/web3.js';
import nacl from 'tweetnacl';

class SOLAccount extends Account {
    private wallet: solanajs.Keypair;

    constructor(wallet: solanajs.Keypair) {
        super(wallet.publicKey.toString(), wallet.publicKey.toString());
        this.wallet = wallet;
    }

    override GetChain(): ChainType {
        return ChainType.Solana;
    }

    override Sign(message: BaseMessage): Promise<string> {
        const buffer = GetVerificationBuffer(message);

        return new Promise((resolve) => {
            const bufferSignature = nacl.sign.detached(buffer, this.wallet.secretKey);

            resolve(
                JSON.stringify({
                    signature: bufferSignature,
                    publicKey: this.publicKey,
                }),
            );
        });
    }
}

export function ImportAccountFromPrivateKey(privateKey: Uint8Array): SOLAccount {
    const wallet: solanajs.Keypair = solanajs.Keypair.fromSecretKey(privateKey);

    return new SOLAccount(wallet);
}

export function NewAccount(): SOLAccount {
    const account = new solanajs.Keypair();

    return ImportAccountFromPrivateKey(account.secretKey);
}
