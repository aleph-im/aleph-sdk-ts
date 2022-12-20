import { ItemType } from "../../../src/messages/message";
import { aggregate, ethereum, post } from "../../index";
import { DEFAULT_API_V2 } from "../../../src/global";
import { v4 as uuidv4 } from "uuid";

describe("Post publish tests", () => {
    it("should amend post message correctly", async () => {
        const mnemonic = "mystery hole village office false satisfy divert cloth behave slim cloth carry";
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);
        const postType = uuidv4();
        const content: { body: string } = {
            body: "Hello World",
        };
        const oldPost = await post.Publish({
            channel: "TEST",
            account: account,
            postType: postType,
            content: content,
        });

        content.body = "New content !";
        const amended = await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
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
                refs: [oldPost.item_hash],
                addresses: [],
                tags: [],
                hashes: [amended.item_hash],
            });
            expect(amends.posts[0].content).toStrictEqual(content);
        });
    });

    it("should delegate amend post message correctly", async () => {
        const account1 = ethereum.NewAccount();
        const account2 = ethereum.NewAccount();

        const originalPost = await post.Publish({
            channel: "TEST",
            account: account1.account,
            postType: "testing_delegate",
            content: { body: "First content" },
        });

        await aggregate.Publish({
            account: account1.account,
            key: "security",
            content: {
                authorizations: [
                    {
                        address: account2.account.address,
                        types: ["POST"],
                        aggregate_keys: ["amend", "testing_delegate"],
                    },
                ],
            },
            channel: "security",
            APIServer: DEFAULT_API_V2,
            storageEngine: ItemType.inline,
        });

        await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            storageEngine: ItemType.ipfs,
            account: account2.account,
            address: account1.account.address,
            postType: "amend",
            content: { body: "First content updated" },
            ref: originalPost.item_hash,
        });

        const amends = await post.Get({
            types: "testing_delegate",
            APIServer: DEFAULT_API_V2,
            pagination: 200,
            page: 1,
            refs: [],
            addresses: [],
            tags: [],
            hashes: [originalPost.item_hash],
        });
        expect(amends.posts[0].content).toStrictEqual({ body: "First content updated" });
    });
});
