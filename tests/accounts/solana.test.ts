import * as solanajs from "@solana/web3.js";
import { ItemType } from "../../src/messages/message";
import { post, solana } from "../index";
import { DEFAULT_API_V2 } from "../../src/global";

describe("Solana accounts", () => {
    it("should create a new solana accounts", () => {
        const { account } = solana.NewAccount();

        expect(account.address).not.toBe("");
        expect(account.publicKey).not.toBe("");
    });

    it("should import an solana accounts using a private key", () => {
        const keyPair = new solanajs.Keypair();
        const account = solana.ImportAccountFromPrivateKey(keyPair.secretKey);

        expect(account.address).not.toBe("");
        expect(account.publicKey).toBe(keyPair.publicKey.toString());
    });

    it("should publish a post message correctly", async () => {
        const { account } = solana.NewAccount();
        const content: { body: string } = {
            body: "Hello World 21",
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

        setTimeout(async () => {
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
        }, 1000);
    });
});
