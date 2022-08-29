import { avalanche, post } from "../index";
import { DEFAULT_API_V2 } from "../../src/global";
import { ItemType } from "../../src/messages/message";

describe("Avalanche accounts", () => {
    it("should create a new Avalanche account", async () => {
        const { account } = await avalanche.NewAccount();

        expect(account.address).not.toBe("");
    });

    it("should retreive an avalanche keypair from an hexadecimal private key", async () => {
        const { account, privateKey } = await avalanche.NewAccount();

        if (privateKey) {
            const accountFromPK = await avalanche.ImportAccountFromPrivateKey(privateKey);
            expect(account.address).toBe(accountFromPK.address);
        } else {
            fail();
        }
    });

    it("should retreive an avalanche keypair from a base58 private key", async () => {
        const keyPair = await avalanche.getKeyPair();
        const hexPrivateKey = keyPair.getPrivateKey().toString("hex");
        const cb58PrivateKey = keyPair.getPrivateKeyString();

        const fromHex = await avalanche.ImportAccountFromPrivateKey(hexPrivateKey);
        const fromCb58 = await avalanche.ImportAccountFromPrivateKey(cb58PrivateKey);

        expect(fromHex.address).toBe(fromCb58.address);
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
