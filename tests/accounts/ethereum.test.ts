import * as bip39 from "bip39";
import { ethereum } from "../index";
import { ethers } from "ethers";
import { EthereumProvider } from "../providers/ethereumProvider";
import { MessageType, ItemType } from "../../src/messages/types";
import { EphAccountList } from "../testAccount/entryPoint";
import fs from "fs";
import { GetVerificationBuffer } from "../../src/messages";
import { verifEthereum } from "../index";

describe("Ethereum accounts", () => {
    let ephemeralAccount: EphAccountList;

    // Import the List of Test Ephemeral test Account, throw if the list is not generated
    beforeAll(async () => {
        if (!fs.existsSync("./tests/testAccount/ephemeralAccount.json"))
            throw Error("[Ephemeral Account Generation] - Error, please run: npm run test:regen");
        ephemeralAccount = await import("../testAccount/ephemeralAccount.json");
        if (!ephemeralAccount.eth.privateKey)
            throw Error("[Ephemeral Account Generation] - Generated Account corrupted");
    });

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
        const { address, privateKey } = ephemeralAccount.eth;
        if (!privateKey) throw Error("Can not retrieve privateKey inside ephemeralAccount.json");

        const provider = new EthereumProvider({
            address,
            privateKey,
            networkVersion: 31,
        });

        const accountFromProvider = await ethereum.GetAccountFromProvider(provider);
        const accountFromPrivate = ethereum.ImportAccountFromPrivateKey(privateKey);

        expect(accountFromProvider.address).toStrictEqual(accountFromPrivate.address);
    });

    it("Should encrypt and decrypt some data with an Ethereum account", async () => {
        const { account } = ethereum.NewAccount();

        const msg = Buffer.from("Innovation");

        const c = await account.encrypt(msg);
        const d = await account.decrypt(c);

        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);
    });

    it("Should delegate encryption for another account Ethereum account", async () => {
        const accountA = ethereum.NewAccount();
        const accountB = ethereum.NewAccount();
        const msg = Buffer.from("Innovation");

        const c = await accountA.account.encrypt(msg, accountB.account);
        const d = await accountB.account.decrypt(c);
        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);

        const e = await accountA.account.encrypt(msg, accountB.account.publicKey);
        const f = await accountB.account.decrypt(e);
        expect(e).not.toBe(msg);
        expect(f).toStrictEqual(d);
    });

    it("Should delegate encrypt and decrypt some data with a provided Ethereum account", async () => {
        const ephAccountA = ephemeralAccount.eth;
        const ephAccountB = ephemeralAccount.eth1;
        if (!ephAccountA.privateKey || !ephAccountB.privateKey)
            throw Error("Can not retrieve privateKey inside ephemeralAccount.json");

        const providerA = new EthereumProvider({
            address: ephAccountA.address,
            privateKey: ephAccountA.privateKey,
            networkVersion: 31,
        });
        const providerB = new EthereumProvider({
            address: ephAccountB.address,
            privateKey: ephAccountB.privateKey,
            networkVersion: 31,
        });

        const accountFromProviderA = await ethereum.GetAccountFromProvider(providerA);
        const accountFromProviderB = await ethereum.GetAccountFromProvider(providerB);
        const msg = Buffer.from("Innovation");

        const c = await accountFromProviderA.encrypt(msg, accountFromProviderB);
        const d = await accountFromProviderB.decrypt(c);

        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);
    });

    it("Should encrypt and decrypt some data with a provided Ethereum account", async () => {
        const { address, privateKey } = ephemeralAccount.eth;
        if (!privateKey) throw Error("Can not retrieve privateKey inside ephemeralAccount.json");

        const provider = new EthereumProvider({
            address,
            privateKey,
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
        const { address, privateKey } = ephemeralAccount.eth;
        if (!privateKey) throw Error("Can not retrieve privateKey inside ephemeralAccount.json");

        const provider = new EthereumProvider({
            address,
            privateKey,
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

    it("Should success to verif the authenticity of a signature", async () => {
        const { account } = ethereum.NewAccount();

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
        const signature = await account.Sign(message);
        const verifA = await verifEthereum(message, signature, account.address);
        const verifB = await verifEthereum(GetVerificationBuffer(message), signature, account.address);

        expect(verifA).toStrictEqual(true);
        expect(verifB).toStrictEqual(true);
    });

    it("Should fail to verif the authenticity of a signature", async () => {
        const { account } = ethereum.NewAccount();
        const fakeAccount = ethereum.NewAccount();

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
        const fakeMessage = {
            ...message,
            item_hash: "FAKE",
        };

        const signature = await account.Sign(message);
        const verif = await verifEthereum(GetVerificationBuffer(fakeMessage), signature, account.address);
        const verifB = await verifEthereum(GetVerificationBuffer(message), signature, fakeAccount.account.address);

        expect(verif).toStrictEqual(false);
        expect(verifB).toStrictEqual(false);
    });
});
