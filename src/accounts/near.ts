import { Account, ChainType } from "./account";
import { BaseMessage, GetVerificationBuffer } from "../messages/message";
import base58 from "bs58";
import * as nearAPI from "near-api-js";
import { ConnectConfig } from "near-api-js/lib/connect";
import { InMemorySigner, KeyPair, keyStores } from "near-api-js";
import { KeyStore } from "near-api-js/lib/key_stores";

export type NearNet = "mainnet" | "betanet" | "testnet";

/**
 * NEARAccount implements the Account class for the NEAR protocol.
 * It is used to represent an near account when publishing a message on the Aleph network.
 */
export class NEARAccount extends Account {
    private readonly wallet: KeyStore;
    private readonly accountId: string;
    private readonly networkId: string;

    constructor(wallet: KeyStore, keypair: KeyPair, accountId: string, networkId: string) {
        const publicKey = keypair.getPublicKey().toString();
        const address = publicKey.replace("ed25519:", "");
        const accountAddress = accountId.concat(":", address);

        super(accountAddress, publicKey);
        this.wallet = wallet;
        this.accountId = accountId;
        this.networkId = networkId;
    }

    override GetChain(): ChainType {
        return ChainType.NEAR;
    }

    /**
     * The Sign method provides a way to sign a given Aleph message using a NEAR account.
     * The full message is not used as the payload, only fields of the BaseMessage type are.
     *
     * The signMessage method of the package 'near-api-js' is used as the signature method.
     *
     * @param message The Aleph message to sign, using some of its fields.
     */
    override async Sign(message: BaseMessage): Promise<string> {
        const buffer = Buffer.from(GetVerificationBuffer(message));

        const signer = new InMemorySigner(this.wallet);
        const signature = await signer.signMessage(buffer, this.accountId, this.networkId);

        return new Promise(async (resolve) => {
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
 * @param network the network where you account belongs.
 * @param accountId Your Near account id.
 * @param privateKey The private key of the account to import.
 */
export async function ImportAccountFromPrivateKey(
    network: NearNet,
    accountId: string,
    privateKey: string,
): Promise<NEARAccount> {
    const { KeyPair, connect } = nearAPI;
    let accountVerified = false;
    const keyStore = new keyStores.InMemoryKeyStore();
    const keyPair = KeyPair.fromString(privateKey);
    const publicKey = keyPair.getPublicKey().toString();
    await keyStore.setKey(network, accountId, keyPair);

    const config: ConnectConfig = {
        headers: {},
        keyStore: keyStore,
        networkId: network,
        nodeUrl: `https://rpc.${network}.near.org`,
        walletUrl: `https://wallet.${network}.near.org`,
        helperUrl: `https://helper.${network}.near.org`,
    };
    const near = await connect(config);
    const account = await near.account(accountId);
    const accessKeys = await account.getAccessKeys();
    for (let i = 0; i < accessKeys.length; i++) {
        if (accessKeys[i].public_key === publicKey) {
            accountVerified = true;
            break;
        }
    }

    if (!accountVerified) throw "Your Near account can't be verified";
    return new NEARAccount(keyStore, keyPair, accountId, network);
}
