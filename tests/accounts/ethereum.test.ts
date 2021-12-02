import * as bip39 from "bip39";
import { ethereum } from "../index";
import { ethers } from "ethers";

describe("Ethereum accounts", () => {
    it("should create a new ethereum accounts", () => {
        const { account } = ethereum.NewAccount();

        expect(account.address).not.toBe("");
        expect(account.publicKey).not.toBe("");
    });

    it("should import an ethereum accounts using a mnemonic", () => {
        const mnemonic = bip39.generateMnemonic();
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);

        expect(account.address).not.toBe("");
        expect(account.publicKey).not.toBe("");
    });

    it("should import an ethereum accounts using a private key", () => {
        const mnemonic = bip39.generateMnemonic();
        const wallet = ethers.Wallet.fromMnemonic(mnemonic);
        const account = ethereum.ImportAccountFromPrivateKey(wallet.privateKey);

        expect(account.address).not.toBe("");
        expect(account.publicKey).toBe(wallet.publicKey);
    });

    it("Should encrypt some data with an Ethereum account", () => {
        const mnemonic = "mystery hole village office false satisfy divert cloth behave slim cloth carry";
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);
        const msg = "Innovation";

        const c = account.encrypt(msg);
        expect(c).not.toBe(msg);
    });

    it("Should encrypt and decrypt some data with an Ethereum account", () => {
        const mnemonic = "mystery hole village office false satisfy divert cloth behave slim cloth carry";
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);
        const msg = "Innovation";

        const c = account.encrypt(msg);
        const d = account.decrypt(c);
        expect(d).toBe(msg);
    });

    it("Should encrypt and decrypt with non regular parameters, some data with an Ethereum account", () => {
        const mnemonic = "mystery hole village office false satisfy divert cloth behave slim cloth carry";
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);
        const msg = "Innovation";

        const c = account.encrypt(msg, { as_hex: false });
        const d = account.decrypt(c, { as_hex: false });
        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);
    });
});
