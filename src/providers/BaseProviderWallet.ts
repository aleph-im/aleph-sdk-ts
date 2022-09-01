export enum ProviderNames {
    METAMASK = "Metamask",
    LEDGER = "Ledger",
}

/**
 * Wrapper for web3 Providers abstraction
 */
export abstract class BaseProviderWallet {
    /**
     * Connects the Provider and fetch an account
     */
    abstract connect(): Promise<void>;

    /**
     * Decrypts data using the Provider
     * @param  {Buffer} data data to decrypt
     */
    abstract decrypt(data: Buffer): Promise<string>;

    /**
     * Returns the name of the provider
     */
    abstract getName(): ProviderNames;

    /**
     * Asks the provider for a public key
     */
    abstract getPublicKey(): Promise<string>;

    /**
     * Signs a message using the Provider
     * @param  {Buffer|string} data The message to sign
     */
    abstract signMessage(data: Buffer | string): Promise<string>;
}
