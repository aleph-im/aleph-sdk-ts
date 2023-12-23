import shajs from "sha.js";
import { ECIESAccount } from "./account";
import { GetVerificationBuffer } from "../messages";
import { BaseMessage, Chain } from "../messages/types";
import { decrypt as secp256k1_decrypt, encrypt as secp256k1_encrypt } from "eciesjs";
import { KeyPair, KeyChain } from "avalanche/dist/apis/avm";
import { KeyPair as EVMKeyPair } from "avalanche/dist/apis/evm";
import { Avalanche, BinTools, Buffer as AvaBuff } from "avalanche";
import { ChangeRpcParam, JsonRPCWallet, RpcChainType } from "./providers/JsonRPCWallet";
import { BaseProviderWallet } from "./providers/BaseProviderWallet";
import { providers } from "ethers";
import { privateToAddress } from "ethereumjs-util";
import { ProviderEncryptionLabel, ProviderEncryptionLib } from "./providers/ProviderEncryptionLib";
/**
 * AvalancheAccount implements the Account class for the Avalanche protocol.
 * It is used to represent an Avalanche account when publishing a message on the Aleph network.
 */
export class AvalancheAccount extends ECIESAccount {
    private signer?: KeyPair | EVMKeyPair;
    private provider?: BaseProviderWallet;
    constructor(signerOrProvider: KeyPair | EVMKeyPair | BaseProviderWallet, address: string, publicKey?: string) {
        super(address, publicKey);
        if (signerOrProvider instanceof KeyPair) this.signer = signerOrProvider;
        if (signerOrProvider instanceof EVMKeyPair) this.signer = signerOrProvider;
        if (signerOrProvider instanceof BaseProviderWallet) this.provider = signerOrProvider;
    }

    override GetChain(): Chain {
        if (this.signer) return Chain.AVAX;
        if (this.provider) return Chain.ETH;

        throw new Error("Cannot determine chain");
    }

    /**
     * Ask for a Provider Account a read Access to its encryption publicKey
     * If the encryption public Key is already loaded, nothing happens
     *
     * This method will throw if:
     * - The account was not instanced with a provider.
     * - The user denied the encryption public key sharing.
     */
    override async askPubKey(): Promise<void> {
        if (!!this.publicKey) return;
        if (!this.provider) throw Error("PublicKey Error: No providers are setup");

        this.publicKey = await this.provider.getPublicKey();
        return;
    }

    /**
     * Retrieves the EVM compatible address for the current account.
     * This function works specifically with the C-Chain.
     *
     * If the current signer is not associated with the C-Chain,
     * the function throws an error.
     *
     * @returns A Promise that resolves to the EVM-style address of the account
     * @throws An error if the current signer is not associated with the C-Chain
     */
    async getEVMAddress(): Promise<string> {
        if (this.signer?.getChainID() === ChainType.C_CHAIN) {
            const pkBuf = this.signer.getPrivateKey();
            const pkHex = pkBuf.toString("hex");
            const pkBuffNative = Buffer.from(pkHex, "hex");
            const ethAddress = privateToAddress(pkBuffNative).toString("hex");
            return `0x${ethAddress}`;
        }
        throw new Error("Wrong chain");
    }

    /**
     * Encrypt a content using the user's public key from the keypair
     *
     * @param content The content to encrypt.
     * @param delegateSupport Optional, if you want to encrypt data for another ECIESAccount (Can also be directly a public key)
     * @param encryptionMethod Optional, chose the standard encryption method to use (With provider).
     */
    async encrypt(
        content: Buffer,
        delegateSupport?: ECIESAccount | string,
        encryptionMethod: ProviderEncryptionLabel = ProviderEncryptionLabel.METAMASK,
    ): Promise<Buffer | string> {
        let publicKey: string | undefined;

        // Does the content is encrypted for a tier?
        if (delegateSupport instanceof ECIESAccount) {
            if (!delegateSupport.publicKey) {
                await delegateSupport.askPubKey();
            }
            publicKey = delegateSupport.publicKey;
        } else if (delegateSupport) {
            publicKey = delegateSupport;
        } else {
            await this.askPubKey();
            publicKey = this.publicKey;
        }

        if (!publicKey) throw new Error("Cannot encrypt content");
        if (!this.provider) {
            // Wallet encryption method or non-metamask provider
            return secp256k1_encrypt(publicKey, content);
        } else {
            // provider encryption
            return ProviderEncryptionLib[encryptionMethod](content, publicKey);
        }
    }

    /**
     * Decrypt a given content using the private key from the keypair.
     *
     * @param encryptedContent The encrypted content to decrypt.
     */
    async decrypt(encryptedContent: Buffer | string): Promise<Buffer> {
        if (this.signer) {
            const secret = this.signer.getPrivateKey().toString("hex");
            return secp256k1_decrypt(secret, Buffer.from(encryptedContent));
        }
        if (this.provider) {
            const decrypted = await this.provider.decrypt(encryptedContent);
            return Buffer.from(decrypted);
        }
        throw new Error("Cannot encrypt content");
    }

    private async digestMessage(message: Buffer) {
        const msgSize = Buffer.alloc(4);
        msgSize.writeUInt32BE(message.length, 0);
        const msgStr = message.toString("utf-8");
        const msgBuf = Buffer.from(`\x1AAvalanche Signed Message:\n${msgSize}${msgStr}`, "utf8");

        return new shajs.sha256().update(msgBuf).digest();
    }

    /**
     * The Sign method provides a way to sign a given Aleph message using an avalanche keypair.
     * The full message is not used as the payload, only fields of the BaseMessage type are.
     *
     * The sign method of the keypair is used as the signature method.
     *
     * @param message The Aleph message to sign, using some of its fields.
     */
    async Sign(message: BaseMessage): Promise<string> {
        const buffer = GetVerificationBuffer(message);
        const digest = await this.digestMessage(buffer);

        if (this.signer) {
            const digestHex = digest.toString("hex");
            const digestBuff = AvaBuff.from(digestHex, "hex");
            const signatureBuffer = this.signer?.sign(digestBuff);

            const bintools = BinTools.getInstance();
            return bintools.cb58Encode(signatureBuffer);
        } else if (this.provider) {
            return await this.provider.signMessage(buffer);
        }

        throw new Error("Cannot sign message");
    }
}

export enum ChainType {
    C_CHAIN = "C",
    X_CHAIN = "X",
}

/**
 * Get Key Chains
 * @param chain Avalanche chain type: c-chain | x-chain
 * @returns key chains
 */
async function getKeyChain(chain = ChainType.X_CHAIN) {
    return new KeyChain(new Avalanche().getHRP(), chain);
}

export async function getKeyPair(privateKey?: string, chain = ChainType.X_CHAIN): Promise<KeyPair> {
    const keyChain = await getKeyChain(chain);
    const keyPair = keyChain.makeKey();

    if (privateKey) {
        let keyBuff: AvaBuff;
        if (privateKey.startsWith("PrivateKey-")) {
            const bintools = BinTools.getInstance();
            keyBuff = bintools.cb58Decode(privateKey.split("-")[1]);
        } else {
            keyBuff = AvaBuff.from(privateKey, "hex");
        }
        if (keyPair.importKey(keyBuff)) return keyPair;
        throw new Error("Invalid private key");
    }
    return keyPair;
}

/**
 * Imports an Avalanche account given a private key and chain
 *
 * It creates an Avalanche keypair containing information about the account, extracted in the AvalancheAccount constructor.
 *
 * @param privateKey The private key of the account to import.
 */
export async function ImportAccountFromPrivateKey(
    privateKey: string,
    chain = ChainType.X_CHAIN,
): Promise<AvalancheAccount> {
    const keyPair = await getKeyPair(privateKey, chain);
    return new AvalancheAccount(keyPair, keyPair.getAddressString(), keyPair.getPublicKey().toString("hex"));
}

/**
 * Get an account from a Web3 provider (ex: Metamask)
 *
 * @param  {providers.ExternalProvider} provider from metamask
 * @param requestedRpc Use this params to change the RPC endpoint;
 */
export async function GetAccountFromProvider(
    provider: providers.ExternalProvider,
    requestedRpc: ChangeRpcParam = RpcChainType.AVAX,
): Promise<AvalancheAccount> {
    const avaxProvider = new providers.Web3Provider(provider);
    const jrw = new JsonRPCWallet(avaxProvider);
    await jrw.changeNetwork(requestedRpc);

    await jrw.connect();
    if (jrw.address) {
        return new AvalancheAccount(jrw, jrw.address);
    }
    throw new Error("Insufficient permissions");
}

/**
 * Creates a new Avalanche account using a randomly generated privateKey
 *
 */
export async function NewAccount(
    chain = ChainType.X_CHAIN,
): Promise<{ account: AvalancheAccount; privateKey: string }> {
    const keypair = await getKeyPair(undefined, chain);
    const privateKey = keypair.getPrivateKey().toString("hex");

    return {
        account: new AvalancheAccount(keypair, keypair.getAddressString(), keypair.getPublicKey().toString("hex")),
        privateKey,
    };
}
