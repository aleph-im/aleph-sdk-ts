import { post } from "@aleph-sdk-ts/messages";
import { utils } from "@aleph-sdk-ts/core-base";
import { messageType } from "@aleph-sdk-ts/core-base";
import { expect } from "@jest/globals";

import { cosmos } from "@aleph-sdk-ts/accounts-software-cosmos";

describe("Cosmos accounts", () => {
    it("should create a new cosmos account", async () => {
        const { account } = await cosmos.NewAccount();

        expect(account.address).not.toBe("");
    });

    it("should import an cosmos accounts using a mnemonic", async () => {
        const refAccount = await cosmos.NewAccount();
        const cloneAccount = await cosmos.ImportAccountFromMnemonic(refAccount.mnemonic);

        expect(refAccount.account.address).toBe(cloneAccount.address);
    });

    it("should publish a post message correctly", async () => {
        const { account } = await cosmos.NewAccount();
        const content: { body: string } = {
            body: "This message was posted from a cosmos account",
        };

        const msg = await post.Publish({
            account,
            APIServer: utils.constant.DEFAULT_API_V2,
            channel: "aleph-ts-sdk-testchannel",
            content,
            inlineRequested: true,
            postType: "custom_type",
            storageEngine: messageType.ItemType.ipfs,
        });

        await (async () => {
            const amends = await post.Get({
                addresses: [],
                APIServer: utils.constant.DEFAULT_API_V2,
                hashes: [msg.item_hash],
                page: 1,
                pagination: 200,
                refs: [],
                tags: [],
                types: "custom_type",
            });
            expect(amends.posts.length).toBeGreaterThan(0);
            // expect(amends.posts[0].content).toStrictEqual(content);
        })();
    });
});
