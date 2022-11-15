import * as bip39 from "bip39";
import { ethereum } from "../index";
import { ethers } from "ethers";
import { EthereumProvider } from "../providers/ethereumProvider";
import { MessageType, ItemType } from "../../src/messages/message";

describe("Ethereum accounts", () => {
    const providerAddress = "0xB98bD7C7f656290071E52D1aA617D9cB4467Fd6D";
    const providerPrivateKey = "de926db3012af759b4f24b5a51ef6afa397f04670f634aa4f48d4480417007f3";

    it("should import an ethereum accounts using a mnemonic", () => {
        const { account, mnemonic } = ethereum.NewAccount();
        const accountFromMnemonic = ethereum.ImportAccountFromMnemonic(mnemonic);

        expect(account.address).toStrictEqual(accountFromMnemonic.address);
    });

    it("should import an ethereum accounts using a private key", () => {
        const mnemonic = bip39.generateMnemonic();
        const wallet = ethers.Wallet.fromMnemonic(mnemonic);
        const accountFromPrivate = ethereum.ImportAccountFromPrivateKey(wallet.privateKey);

        expect(wallet.address).toStrictEqual(accountFromPrivate.address);
    });

    it("should import an ethereum accounts using a provider", async () => {
        const provider = new EthereumProvider({
            address: providerAddress,
            privateKey: providerPrivateKey,
            networkVersion: 31,
        });

        const accountFromProvider = await ethereum.GetAccountFromProvider(provider);
        const accountFromPrivate = ethereum.ImportAccountFromPrivateKey(providerPrivateKey);

        expect(accountFromProvider.address).toStrictEqual(accountFromPrivate.address);
    });

    it("Should encrypt and decrypt some data with an Ethereum account", async () => {
        const mnemonic = "mystery hole village office false satisfy divert cloth behave slim cloth carry";
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);
        const msg = Buffer.from("Innovation");

        const c = await account.encrypt(msg);
        const d = await account.decrypt(c);

        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);
    });

    it("Should delegate encryption for another account Ethereum account", async () => {
        const mnemonicA = "mystery hole village office false satisfy divert cloth behave slim cloth carry";
        const mnemonicB = "omit donor guilt push electric confirm denial clever clay cabbage game boil";
        const accountBPublicKey =
            "0x0455d7d2ff3dff02674bc446ec2a821508d3ef0965c9eb0adc9890fecbcc44f86731002cc98fa578c6156e8e7f11b589d2524ca9f0a9be06864592d36164ad1801";

        const accountA = ethereum.ImportAccountFromMnemonic(mnemonicA);
        const accountB = ethereum.ImportAccountFromMnemonic(mnemonicB);
        const msg = Buffer.from("Innovation");

        const c = await accountA.delegateEncrypt(accountBPublicKey, msg);
        const d = await accountB.decrypt(c);

        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);
    });

    it("Should encrypt and decrypt some data with a provided Ethereum account", async () => {
        const provider = new EthereumProvider({
            address: providerAddress,
            privateKey: providerPrivateKey,
            networkVersion: 31,
        });
        const accountFromProvider = await ethereum.GetAccountFromProvider(provider);
        const msg = Buffer.from("Innovation");

        const c = await accountFromProvider.encrypt(msg);
        const d = await accountFromProvider.decrypt(c);

        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);
    });

    it("should get the same signed message for each account", async () => {
        const provider = new EthereumProvider({
            address: providerAddress,
            privateKey: providerPrivateKey,
            networkVersion: 31,
        });
        const { account, mnemonic } = ethereum.NewAccount();
        const accountFromProvider = await ethereum.GetAccountFromProvider(provider);
        const accountFromPrivate = await ethereum.ImportAccountFromMnemonic(mnemonic);

        const message = {
            chain: account.GetChain(),
            sender: account.address,
            type: MessageType.post,
            channel: "TEST",
            confirmed: true,
            signature: "signature",
            size: 15,
            time: 15,
            item_type: ItemType.storage,
            item_content: "content",
            item_hash: "hash",
            content: { address: account.address, time: 15 },
        };

        expect(account.Sign(message)).toStrictEqual(accountFromPrivate.Sign(message));
        expect(account.Sign(message)).toStrictEqual(accountFromProvider.Sign(message));
    });
});
