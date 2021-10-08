import * as solanajs from "@solana/web3.js";
import { accounts, DEFAULT_API_V2, post } from "../../src/index";
import { StorageEngine } from "../../src/messages/message";

describe("Solana accounts", () => {
    it("should create a new solana accounts", () => {
        const account = accounts.solana.NewAccount();

        expect(account.address).not.toBe("");
        expect(account.publicKey).not.toBe("");
    });

    it("should import an solana accounts using a private key", () => {
        const keyPair = new solanajs.Keypair();
        const account = accounts.solana.ImportAccountFromPrivateKey(keyPair.secretKey);

        expect(account.address).not.toBe("");
        expect(account.publicKey).toBe(keyPair.publicKey.toString());
    });

    it("should publish a post message correctly", async () => {
        const account = accounts.solana.NewAccount();
        const content: { body: string } = {
            body: "Hello World",
        };

        await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            inlineRequested: true,
            storageEngine: StorageEngine.IPFS,
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
            hashes: [],
        });

        expect(amends.posts[0].content).toStrictEqual(content);
    });
});
