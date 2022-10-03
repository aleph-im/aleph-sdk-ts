import * as solanajs from "@solana/web3.js";

import { post } from "@aleph-sdk-ts/messages";
import { ItemType } from "@aleph-sdk-ts/core-base/dist/messages";
import { DEFAULT_API_V2 } from "@aleph-sdk-ts/core-base/dist/utils/constant";
import { expect } from "@jest/globals";
import { solana } from "@aleph-sdk-ts/accounts-software-solana";

describe("Solana accounts", () => {
    it("should create a new solana accounts", () => {
        const { account } = solana.NewAccount();

        expect(account.address).not.toBe("");
    });

    it("should import an solana accounts using a private key", () => {
        const keyPair = new solanajs.Keypair();
        const account = solana.ImportAccountFromPrivateKey(keyPair.secretKey);

        expect(account.address).not.toBe("");
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
            postType: "solana",
            content: content,
        });

        setTimeout(async () => {
            const amends = await post.Get({
                types: "solana",
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
