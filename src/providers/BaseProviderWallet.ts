export enum ProviderNames {
    METAMASK = "Metamask",
    LEDGER = "Ledger",
}

export abstract class BaseProviderWallet {
    abstract connect(): Promise<void>;
    abstract decrypt(data: Buffer): Promise<string>;
    abstract getName(): ProviderNames;
    abstract getPublicKey(): Promise<string>;
    abstract signMessage(data: Buffer | string): Promise<string>;
}
