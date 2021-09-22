import * as solanajs from '@solana/web3.js';
import { accounts } from '../../src/index';

describe('Solana accounts', () => {
    it('should create a new solana accounts', () => {
        const account = accounts.solana.NewAccount();

        expect(account.address).not.toBe('');
        expect(account.publicKey).not.toBe('');
    });

    it('should import an solana accounts using a private key', () => {
        const keyPair = new solanajs.Keypair();
        const account = accounts.solana.ImportAccountFromPrivateKey(keyPair.secretKey);

        expect(account.address).not.toBe('');
        expect(account.publicKey).toBe(keyPair.publicKey.toString());
    });
});
