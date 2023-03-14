import { avalanche, post } from "../index";
import { EthereumProvider } from "../providers/ethereumProvider";
import { EphAccountList } from "../testAccount/entryPoint";
import fs from "fs";

describe("Avalanche accounts", () => {
    let ephemeralAccount: EphAccountList;

    // Import the List of Test Ephemeral test Account, throw if the list is not generated
    beforeAll(async () => {
        if (!fs.existsSync("./tests/testAccount/ephemeralAccount.json"))
            throw Error("[Ephemeral Account Generation] - Error, please run: npm run test:regen");
        ephemeralAccount = await import("../testAccount/ephemeralAccount.json");
        if (!ephemeralAccount.avax.privateKey)
            throw Error("[Ephemeral Account Generation] - Generated Account corrupted");
    });

    it("should retrieved an avalanche keypair from an hexadecimal private key", async () => {
        const { account, privateKey } = await avalanche.NewAccount();

        if (privateKey) {
            const accountFromPK = await avalanche.ImportAccountFromPrivateKey(privateKey);
            expect(account.address).toBe(accountFromPK.address);
        } else {
            throw Error();
        }
    });

    it("should throw Error to get a Keypair", async () => {
        const fakePrivateKey = "a";
        const fct = async () => await avalanche.ImportAccountFromPrivateKey(fakePrivateKey);

        await expect(fct).rejects.toThrow("Invalid private key");
    });

    it("should import an ethereum accounts using a provider", async () => {
        const { address, privateKey } = ephemeralAccount.eth;
        if (!privateKey) throw Error("Can not retrieve privateKey inside ephemeralAccount.json");

        const provider = new EthereumProvider({
            address,
            privateKey,
            networkVersion: 31,
        });

        const accountFromProvider = await avalanche.GetAccountFromProvider(provider);
        expect(accountFromProvider.address).toStrictEqual(address);
    });

    it("Should encrypt and decrypt some data with an Avalanche keypair", async () => {
        const { account } = await avalanche.NewAccount();
        const msg = Buffer.from("Laŭ Ludoviko Zamenhof bongustas freŝa ĉeĥa manĝaĵo kun spicoj");

        const c = await account.encrypt(msg);
        const d = await account.decrypt(c);

        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);
    });

    it("Should delegate encryption for another account Avalanche account", async () => {
        const accountA = await avalanche.NewAccount();
        const accountB = await avalanche.NewAccount();
        const msg = Buffer.from("Innovation");

        const c = await accountA.account.encrypt(msg, accountB.account.publicKey);
        const d = await accountB.account.decrypt(c);
        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);

        const e = await accountA.account.encrypt(msg, accountB.account.publicKey);
        const f = await accountB.account.decrypt(e);
        expect(e).not.toBe(msg);
        expect(f).toStrictEqual(d);
    });

    it("Should encrypt and decrypt some data with an Avalanche account from provider", async () => {
        const { address, privateKey } = ephemeralAccount.eth;
        if (!privateKey) throw Error("Can not retrieve privateKey inside ephemeralAccount.json");

        const provider = new EthereumProvider({
            address,
            privateKey,
            networkVersion: 31,
        });
        const accountFromProvider = await avalanche.GetAccountFromProvider(provider);
        const msg = Buffer.from("Laŭ Ludoviko Zamenhof bongustas freŝa ĉeĥa manĝaĵo kun spicoj");

        const c = await accountFromProvider.encrypt(msg);
        const d = await accountFromProvider.decrypt(c);

        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);
    });

    it("Should delegate encrypt and decrypt some data with an Avalanche account from provider", async () => {
        const accountA = ephemeralAccount.eth;
        const accountB = ephemeralAccount.eth1;
        if (!accountB.privateKey || !accountA.privateKey)
            throw Error("Can not retrieve privateKey inside ephemeralAccount.json");

        const providerA = new EthereumProvider({
            address: accountA.address,
            privateKey: accountA.privateKey,
            networkVersion: 31,
        });
        const providerB = new EthereumProvider({
            address: accountB.address,
            privateKey: accountB.privateKey,
            networkVersion: 31,
        });

        const accountFromProviderA = await avalanche.GetAccountFromProvider(providerA);
        const accountFromProviderB = await avalanche.GetAccountFromProvider(providerB);
        const msg = Buffer.from("Laŭ Ludoviko Zamenhof bongustas freŝa ĉeĥa manĝaĵo kun spicoj");

        const c = await accountFromProviderA.encrypt(msg, accountFromProviderB);
        const d = await accountFromProviderB.decrypt(c);

        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);
    });

    it("should publish a post message correctly with an account from a provider", async () => {
        const { address, privateKey } = ephemeralAccount.eth;
        if (!privateKey) throw Error("Can not retrieve privateKey inside ephemeralAccount.json");

        const provider = new EthereumProvider({
            address,
            privateKey,
            networkVersion: 31,
        });
        const accountFromProvider = await avalanche.GetAccountFromProvider(provider);
        const content: { body: string } = {
            body: "This message was posted from the typescript-SDK test suite",
        };

        const msg = await post.Publish({
            channel: "TEST",
            account: accountFromProvider,
            postType: "avalanche",
            content: content,
        });

        expect(msg.item_hash).not.toBeUndefined();
        setTimeout(async () => {
            const amends = await post.Get({
                types: "avalanche",
                hashes: [msg.item_hash],
            });
            expect(amends.posts[0].content).toStrictEqual(content);
        });
    });

    it("should publish a post message correctly", async () => {
        const { privateKey } = ephemeralAccount.avax;
        if (!privateKey) throw Error("Can not retrieve privateKey inside ephemeralAccount.json");

        const account = await avalanche.ImportAccountFromPrivateKey(privateKey);
        const content: { body: string } = {
            body: "This message was posted from the typescript-SDK test suite",
        };

        const msg = await post.Publish({
            channel: "TEST",
            account: account,
            postType: "avalanche",
            content: content,
        });

        expect(msg.item_hash).not.toBeUndefined();
        setTimeout(async () => {
            const amends = await post.Get({
                types: "avalanche",
                hashes: [msg.item_hash],
            });
            expect(amends.posts[0].content).toStrictEqual(content);
        });
    });
});
