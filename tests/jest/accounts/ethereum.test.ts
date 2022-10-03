import * as bip39 from "bip39";
import { ethers } from "ethers";

import { ethereum } from "@aleph-sdk-ts/accounts-software-ethereum";
import { expect } from "@jest/globals";

describe("Ethereum accounts", () => {
    it("should create a new ethereum accounts", () => {
        const { account } = ethereum.NewAccount();

        expect(account.address).not.toBe("");
    });

    it("should import an ethereum accounts using a mnemonic", () => {
        const mnemonic = bip39.generateMnemonic();
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);

        expect(account.address).not.toBe("");
    });

    it("should import an ethereum accounts using a private key", () => {
        const mnemonic = bip39.generateMnemonic();
        const wallet = ethers.Wallet.fromMnemonic(mnemonic);
        const account = ethereum.ImportAccountFromPrivateKey(wallet.privateKey);

        expect(account.address).not.toBe("");
    });

    it("Should encrypt some data with an Ethereum account", () => {
        const mnemonic = "mystery hole village office false satisfy divert cloth behave slim cloth carry";
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);
        const msg = Buffer.from("Innovation");

        const c = account.encrypt(msg);
        expect(c).not.toBe(msg);
    });

    it("Should encrypt and decrypt some data with an Ethereum account", async () => {
        const mnemonic = "mystery hole village office false satisfy divert cloth behave slim cloth carry";
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);
        const msg = Buffer.from("Innovation");

        const c = await account.encrypt(msg);
        const d = await account.decrypt(c);

        expect(d).toStrictEqual(msg);
    });
});
