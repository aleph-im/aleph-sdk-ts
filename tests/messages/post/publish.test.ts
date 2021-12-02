import { ItemType } from "../../../src/messages/message";
import { ethereum, post } from "../../index";
import { DEFAULT_API_V2 } from "../../../src/global";
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

        setTimeout(async () => {
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
