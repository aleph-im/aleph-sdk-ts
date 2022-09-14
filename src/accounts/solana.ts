import { Account } from "./account";
import { BaseMessage, Chain } from "../messages/message";
import { GetVerificationBuffer } from "../messages";
import { Keypair, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import base58 from "bs58";

type WalletSignature = {
    signature: Uint8Array;
    publicKey: string;
};

interface MessageSigner {
    signMessage(message: Uint8Array): Promise<WalletSignature>;
    publicKey: PublicKey;
    connected: boolean;
    connect(): Promise<void>;
}

/**
 * SOLAccount implements the Account class for the Solana protocol.
 * It is used to represent an solana account when publishing a message on the Aleph network.
 */
export class SOLAccount extends Account {
    private wallet?: MessageSigner;
    private keypair?: Keypair;

    constructor(publicKey: PublicKey, walletOrKeypair: Keypair | MessageSigner) {
        super(publicKey.toString());
        if (walletOrKeypair instanceof Keypair) {
            this.keypair = walletOrKeypair;
        } else {
            this.wallet = walletOrKeypair;
        }
    }

    override GetChain(): Chain {
        return Chain.SOL;
    }

    /**
     * The Sign method provides a way to sign a given Aleph message using an solana account.
     * The full message is not used as the payload, only fields of the BaseMessage type are.
     *
     * nacl is used to sign the payload with the account's private key.
     * The final message's signature is composed of the signed payload and the user's public key.
     *
     * @param message The Aleph message to sign, using some of its fields.
     */
    override async Sign(message: BaseMessage): Promise<string> {
        const buffer = GetVerificationBuffer(message);
        let signature;

        if (this.wallet) {
            const signed = await this.wallet.signMessage(buffer);
            signature = signed.signature;
        } else if (this.keypair) {
            signature = nacl.sign.detached(buffer, this.keypair.secretKey);
        } else {
            throw new Error("Cannot sign message");
        }

        return JSON.stringify({
            signature: base58.encode(signature),
            publicKey: this.address,
        });
    }
}

/**
 * Imports an solana account given a private key and the Keypair solana/web3js package's class.
 *
 * It creates an solana wallet containing information about the account, extracted in the SOLAccount constructor.
 *
 * @param privateKey The private key of the account to import.
 */
export function ImportAccountFromPrivateKey(privateKey: string): SOLAccount {
    const keypair = Keypair.fromSecretKey(Buffer.from(privateKey));

    return new SOLAccount(keypair.publicKey, keypair);
}

/**
 * Creates a new solana account using a randomly generated solana keypair.
 */
export function NewAccount(): { account: SOLAccount; privateKey: Uint8Array } {
    const account = new Keypair();

    return { account: ImportAccountFromPrivateKey(account.secretKey.toString()), privateKey: account.secretKey };
}

/**
 * Retrieves a solana account using an in-browser wallet provider
 */
export async function GetAccountFromProvider(provider: MessageSigner): Promise<SOLAccount> {
    if (!provider.connected) await provider.connect();
    if (!provider.publicKey) throw new Error("This wallet does not provide a public key");

    return new SOLAccount(provider.publicKey, provider);
}
