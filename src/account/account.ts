export abstract class Account {
    readonly address: string;
    readonly publicKey: string;

    protected constructor(address: string, publicKey: string) {
        this.address = address;
        this.publicKey = publicKey;
    }
}
