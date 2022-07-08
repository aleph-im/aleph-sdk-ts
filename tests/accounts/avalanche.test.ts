import { avalanche } from "../index";
import * as bip39 from "bip39";
import * as bip32 from "bip32";
import { fail } from "assert";

describe("Avalanche accounts", () => {
    it("should create a new Avalanche account", async () => {
        const { account } = await avalanche.NewAccount();

        expect(account.address).not.toBe("");
        expect(account.publicKey).not.toBe("");
    });

    it("should retrieve an avalanche keypair from a mnemonic", async () => {
        const mnemonic = bip39.generateMnemonic();
        const account = await avalanche.ImportAccountFromMnemonic(mnemonic);

        expect(account.address).not.toBe("");
        expect(account.publicKey).not.toBe("");
    });

    it("should retrieve an avalanche keypair from a private key", async () => {
        const { account, mnemonic } = await avalanche.NewAccount();
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const bip32I = bip32.fromSeed(seed);
        const privateKey = bip32I?.privateKey;

        if (privateKey) {
            const accountFromPK = await avalanche.ImportAccountFromPrivateKey(privateKey.toString("hex"));
            expect(account.publicKey).toBe(accountFromPK.publicKey);
        } else {
            fail();
        }
    });

    it("Should encrypt some data with an Avalanche keypair", async () => {
        const { account } = await avalanche.NewAccount();
        const msg = Buffer.from("Laŭ Ludoviko Zamenhof bongustas freŝa ĉeĥa manĝaĵo kun spicoj");

        const c = account.encrypt(msg);
        expect(c).not.toBe(msg);
    });

    it("Should encrypt and decrypt some data with an Avalanche keypair", async () => {
        const { account } = await avalanche.NewAccount();
        const msg = Buffer.from("Laŭ Ludoviko Zamenhof bongustas freŝa ĉeĥa manĝaĵo kun spicoj");

        const c = account.encrypt(msg);
        const d = account.decrypt(c);

        expect(d).toStrictEqual(msg);
    });
});
