import { Account, ChainType } from "./account";
import { BaseMessage, GetVerificationBuffer } from "../messages/message";
import * as solanajs from "@solana/web3.js";
import nacl from "tweetnacl";

/**
 * SOLAccount implements the Account class for the Solana protocol.
 * It is used to represent an solana account when publishing a message on the Aleph network.
 */
class SOLAccount extends Account {
    private wallet: solanajs.Keypair;

    constructor(wallet: solanajs.Keypair) {
        super(wallet.publicKey.toString(), wallet.publicKey.toString());
        this.wallet = wallet;
    }

    override GetChain(): ChainType {
        return ChainType.Solana;
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

/**
 * Imports an solana account given a private key and the Keypair solana/web3js package's class.
 *
 * It creates an solana wallet containing information about the account, extracted in the SOLAccount constructor.
 *
 * @param privateKey The private key of the account to import.
 */
export function ImportAccountFromPrivateKey(privateKey: Uint8Array): SOLAccount {
    const wallet: solanajs.Keypair = solanajs.Keypair.fromSecretKey(privateKey);

    return new SOLAccount(wallet);
}

/**
 * Creates a new solana account using a randomly generated solana keypair.
 */
export function NewAccount(): SOLAccount {
    const account = new solanajs.Keypair();

    return ImportAccountFromPrivateKey(account.secretKey);
}
