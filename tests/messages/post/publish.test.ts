import { StorageEngine } from "../../../src/messages/message";
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
                storageEngine: StorageEngine.IPFS,
                account: account,
                postType: "custom_type",
                content: content,
            });
        }).not.toThrow();
    });

    it("should amend post message correctly", async () => {
        const { account } = ethereum.NewAccount();
        const postType = uuidv4();
        const content: { body: string } = {
            body: "Hello World",
        };
        const oldPost = await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            inlineRequested: true,
            storageEngine: StorageEngine.IPFS,
            account: account,
            postType: postType,
            content: content,
        });

        content.body = "New content !";
        await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            inlineRequested: true,
            storageEngine: StorageEngine.IPFS,
            account: account,
            postType: "amend",
            content: content,
            ref: oldPost.item_hash,
        });

        const amends = await post.Get({
            types: postType,
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
