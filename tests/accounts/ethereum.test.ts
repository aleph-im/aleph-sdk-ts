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
});
