import { ItemType } from "@aleph-sdk-ts/core-base/dist/messages";
import { ethereum } from "@aleph-sdk-ts/accounts-software-ethereum";
import { DEFAULT_API_V2 } from "@aleph-sdk-ts/core-base/dist/utils/constant";
import { post } from "@aleph-sdk-ts/messages";
import { expect } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

describe("Post publish tests", () => {
    it("should publish post message correctly", async () => {
        const { account } = ethereum.NewAccount();
        const content: { body: string } = {
            body: "Hello World",
        };

        expect(async () => {
            await post.Publish({
                APIServer: DEFAULT_API_V2,
                channel: "TEST",
                inlineRequested: true,
                storageEngine: ItemType.ipfs,
                account: account,
                postType: "custom_type",
                content: content,
            });
        }).not.toThrow();
    });

    it("should amend post message correctly", async () => {
        const mnemonic = "mystery hole village office false satisfy divert cloth behave slim cloth carry";
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);
        const postType = uuidv4();
        const content: { body: string } = {
            body: "Hello World",
        };
        const oldPost = await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            inlineRequested: true,
            storageEngine: ItemType.ipfs,
            account: account,
            postType: postType,
            content: content,
        });

        content.body = "New content !";
        const newMessage = await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            inlineRequested: true,
            storageEngine: ItemType.ipfs,
            account: account,
            postType: "amend",
            content: content,
            ref: oldPost.item_hash,
        });

        await setTimeout(async () => {
            const amends = await post.Get({
                types: "amend",
                APIServer: DEFAULT_API_V2,
                pagination: 200,
                page: 1,
                refs: [],
                addresses: [],
                tags: [],
                hashes: [newMessage.item_hash],
            });
            expect(amends.posts[0].content).toStrictEqual(content);
        });
    });
});
