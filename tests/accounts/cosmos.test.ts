import { cosmos, post } from "../index";
import { DEFAULT_API_V2 } from "../../src/global";
import { ItemType } from "../../src/messages/message";

describe("Cosmos accounts", () => {
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
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            content,
            inlineRequested: true,
            postType: "cosmos",
            storageEngine: ItemType.ipfs,
        });

        expect(msg.item_hash).not.toBeUndefined();
        setTimeout(async () => {
            const amends = await post.Get({
                addresses: [],
                APIServer: DEFAULT_API_V2,
                hashes: [msg.item_hash],
                page: 1,
                pagination: 200,
                refs: [],
                tags: [],
                types: "cosmos",
            });
            expect(amends.posts.length).toBeGreaterThan(0);
            // expect(amends.posts[0].content).toStrictEqual(content);
        });
    });
});
