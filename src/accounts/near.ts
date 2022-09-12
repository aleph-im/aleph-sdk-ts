import { Account } from "./account";
import { BaseMessage, Chain } from "../messages/message";
import { GetVerificationBuffer } from "../messages";
import base58 from "bs58";
import * as nearAPI from "near-api-js";

/**
 * NEARAccount implements the Account class for the NEAR protocol.
 * It is used to represent an near account when publishing a message on the Aleph network.
 */
export class NEARAccount extends Account {
    private readonly wallet: nearAPI.KeyPair;

    constructor(wallet: nearAPI.KeyPair) {
        const publicKey = wallet.getPublicKey().toString().replace("ed25519:", "");
        const address = base58.decode(publicKey).toString("hex");

        super(address);
        this.wallet = wallet;
    }

    override GetChain(): Chain {
        return Chain.NEAR;
    }

    /**
     * The Sign method provides a way to sign a given Aleph message using a NEAR account.
     * The full message is not used as the payload, only fields of the BaseMessage type are.
     *
     * The signMessage method of the package 'near-api-js' is used as the signature method.
     *
     * @param message The Aleph message to sign, using some of its fields.
     */
    override Sign(message: BaseMessage): Promise<string> {
        const buffer = Buffer.from(GetVerificationBuffer(message));

        return new Promise((resolve) => {
            const signature = this.wallet.sign(buffer);

            resolve(
                JSON.stringify({
                    signature: base58.encode(signature.signature),
                    publicKey: base58.encode(signature.publicKey.data),
                }),
            );
        });
    }
}

/**
 * Imports a NEAR account given a private key and the 'near-api-js' package.
 *
 * It creates a NEAR wallet containing information about the account, extracted in the NEARAccount constructor.
 *
 * @param privateKey The private key of the account to import.
 */
export function ImportAccountFromPrivateKey(privateKey: string): NEARAccount {
    const { KeyPair } = nearAPI;

    const keyPair = KeyPair.fromString(privateKey);
    return new NEARAccount(keyPair);
}

/**
 * Creates a new NEAR account using the fromRandom method given by 'near-api-js'
 */
export function NewAccount(): NEARAccount {
    const { KeyPair } = nearAPI;

    const keyPair = KeyPair.fromRandom("ed25519");
    return new NEARAccount(keyPair);
}
