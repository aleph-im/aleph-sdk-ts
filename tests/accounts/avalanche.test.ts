import { avalanche, post } from "../index";
import { DEFAULT_API_V2 } from "../../src/global";
import { ItemType } from "../../src/messages/message";
import { EthereumProvider } from "../providers/ethereumProvider";

describe("Avalanche accounts", () => {
    const providerAddress = "0xB98bD7C7f656290071E52D1aA617D9cB4467Fd6D";
    const providerPrivateKey = "de926db3012af759b4f24b5a51ef6afa397f04670f634aa4f48d4480417007f3";

    it("should retrieved an avalanche keypair from an hexadecimal private key", async () => {
        const { account, privateKey } = await avalanche.NewAccount();

        if (privateKey) {
            const accountFromPK = await avalanche.ImportAccountFromPrivateKey(privateKey);
            expect(account.address).toBe(accountFromPK.address);
        } else {
            fail();
        }
    });

    it("should fail to get a Keypair", async () => {
        const fakePrivateKey = "a";
        const fct = async () => await avalanche.ImportAccountFromPrivateKey(fakePrivateKey);

        await expect(fct).rejects.toThrow("Invalid private key");
    });

    it("should retrieved an avalanche keypair from a base58 private key", async () => {
        const keyPair = await avalanche.getKeyPair();
        const hexPrivateKey = keyPair.getPrivateKey().toString("hex");
        const cb58PrivateKey = keyPair.getPrivateKeyString();

        const fromHex = await avalanche.ImportAccountFromPrivateKey(hexPrivateKey);
        const fromCb58 = await avalanche.ImportAccountFromPrivateKey(cb58PrivateKey);

        expect(fromHex.address).toBe(fromCb58.address);
    });

    it("should import an ethereum accounts using a provider", async () => {
        const provider = new EthereumProvider({
            address: providerAddress,
            privateKey: providerPrivateKey,
            networkVersion: 31,
        });

        const accountFromProvider = await avalanche.GetAccountFromProvider(provider);
        expect(accountFromProvider.address).toStrictEqual(providerAddress);
    });

    it("Should encrypt and decrypt some data with an Avalanche keypair", async () => {
        const { account } = await avalanche.NewAccount();
        const msg = Buffer.from("Laŭ Ludoviko Zamenhof bongustas freŝa ĉeĥa manĝaĵo kun spicoj");

        const c = await account.encrypt(msg);
        const d = await account.decrypt(c);

        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);
    });

    it("Should encrypt and decrypt some data with an Avalanche account from provider", async () => {
        const provider = new EthereumProvider({
            address: providerAddress,
            privateKey: providerPrivateKey,
            networkVersion: 31,
        });
        const accountFromProvider = await avalanche.GetAccountFromProvider(provider);
        const msg = Buffer.from("Laŭ Ludoviko Zamenhof bongustas freŝa ĉeĥa manĝaĵo kun spicoj");

        const c = await accountFromProvider.encrypt(msg);
        const d = await accountFromProvider.decrypt(c);

        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);
    });

    it("should publish a post message correctly with an account from a provider", async () => {
        const provider = new EthereumProvider({
            address: providerAddress,
            privateKey: providerPrivateKey,
            networkVersion: 31,
        });
        const accountFromProvider = await avalanche.GetAccountFromProvider(provider);
        const content: { body: string } = {
            body: "This message was posted from the typescript-SDK test suite",
        };

        const msg = await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            inlineRequested: true,
            storageEngine: ItemType.ipfs,
            account: accountFromProvider,
            postType: "avalanche",
            content: content,
        });

        expect(msg.item_hash).not.toBeUndefined();
        setTimeout(async () => {
            const amends = await post.Get({
                types: "avalanche",
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

    it("should publish a post message correctly", async () => {
        const { account } = await avalanche.NewAccount();
        const content: { body: string } = {
            body: "This message was posted from the typescript-SDK test suite",
        };

        const msg = await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            inlineRequested: true,
            storageEngine: ItemType.ipfs,
            account: account,
            postType: "avalanche",
            content: content,
        });

        expect(msg.item_hash).not.toBeUndefined();
        setTimeout(async () => {
            const amends = await post.Get({
                types: "avalanche",
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
});
