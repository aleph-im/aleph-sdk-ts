import { cosmos, post } from "../index";
import { DEFAULT_API_V2 } from "../../src/global";
import { ItemType } from "../../src/messages/message";

describe("Cosmos accounts", () => {
    it("should create a new cosmos account", async () => {
        const { account } = await cosmos.NewAccount();

        expect(account.address).not.toBe("");
        expect(account.publicKey).not.toBe("");
    });

    it("should import an cosmos accounts using a mnemonic", async () => {
        const refAccount = await cosmos.NewAccount();
        const cloneAccount = await cosmos.ImportAccountFromMnemonic(refAccount.mnemonic);

        expect(refAccount.account.address).toBe(cloneAccount.address);
        expect(refAccount.account.publicKey).toBe(cloneAccount.publicKey);
    });

    it("should publish a post message correctly", async () => {
        const { account } = await cosmos.NewAccount();
        const content: { body: string } = {
            body: "This message was posted from a cosmos account",
        };

        const msg = await post.Publish({
            account,
            APIServer: DEFAULT_API_V2,
            channel: "aleph-ts-sdk-testchannel",
            content,
            inlineRequested: true,
            postType: "custom_type",
            storageEngine: ItemType.ipfs,
        });

        await (async () => {
            const amends = await post.Get({
                addresses: [],
                APIServer: DEFAULT_API_V2,
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
