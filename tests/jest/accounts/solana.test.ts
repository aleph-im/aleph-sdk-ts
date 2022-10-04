import * as solanajs from "@solana/web3.js";

import { post } from "@aleph-sdk-ts/messages";
import { messageType } from "@aleph-sdk-ts/core-base";
import { utils } from "@aleph-sdk-ts/core-base";
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
            APIServer: utils.constant.DEFAULT_API_V2,
            channel: "TEST",
            inlineRequested: true,
            storageEngine: messageType.ItemType.ipfs,
            account: account,
            postType: "solana",
            content: content,
        });

        setTimeout(async () => {
            const amends = await post.Get({
                types: "solana",
                APIServer: utils.constant.DEFAULT_API_V2,
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
