import * as bip39 from "bip39";
import { ethereum, post } from "../index";
import { ethers } from "ethers";
import { DEFAULT_API_V2 } from "../../src/global";
import { Chain, ItemType, MessageType } from "../../src/messages/message";
import { EthereumProvider } from "../provider/ethereumProvider";

describe("Ethereum accounts", () => {
    const providerAddress = "0xB98bD7C7f656290071E52D1aA617D9cB4467Fd6D";
    const providerPrivateKey = "de926db3012af759b4f24b5a51ef6afa397f04670f634aa4f48d4480417007f3";

    it("should import an ethereum accounts using a mnemonic", () => {
        const { account, mnemonic } = ethereum.NewAccount();
        const accountFromMnemonic = ethereum.ImportAccountFromMnemonic(mnemonic);

        expect(account.address).toStrictEqual(accountFromMnemonic.address);
        expect(account.GetChain()).toStrictEqual(Chain.ETH);
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
        const account = ethereum.ImportAccountFromPrivateKey(providerPrivateKey);
        const msg = Buffer.from("Innovation");

        const c = await account.encrypt(msg);
        const d = await account.decrypt(c);

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

    it("should publish a post message correctly", async () => {
        const { account } = ethereum.NewAccount();
        const content: { body: string } = {
            body: "This message was posted from the typescript-SDK test suite with ETH",
        };

        const msg = await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            inlineRequested: false,
            storageEngine: ItemType.storage,
            account: account,
            postType: "custom_type",
            content: content,
        });

        const amends = await post.Get({
            types: "custom_type",
            APIServer: DEFAULT_API_V2,
            pagination: 200,
            page: 1,
            refs: [],
            addresses: [],
            tags: [],
            hashes: [msg.item_hash],
        });
        expect(amends.posts[0].content).toStrictEqual(content);
    });
});
