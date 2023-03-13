import { ItemType } from "../../../src/messages/message";
import { aggregate, ethereum, post } from "../../index";
import { DEFAULT_API_V2 } from "../../../src/global";
import { v4 as uuidv4 } from "uuid";
import { EphAccountList } from "../../testAccount/entryPoint";
import fs from "fs";

describe("Post publish tests", () => {
    let ephemeralAccount: EphAccountList;

    // Import the List of Test Ephemeral test Account, throw if the list is not generated
    beforeAll(async () => {
        if (!fs.existsSync("./tests/testAccount/ephemeralAccount.json"))
            throw Error("[Ephemeral Account Generation] - Error, please run: npm run test:regen");
        ephemeralAccount = await import("../../testAccount/ephemeralAccount.json");
        if (!ephemeralAccount.eth.privateKey)
            throw Error("[Ephemeral Account Generation] - Generated Account corrupted");
    });

    it("should amend post message correctly", async () => {
        const { mnemonic } = ephemeralAccount.eth;
        if (!mnemonic) throw Error("Can not retrieve mnemonic inside ephemeralAccount.json");
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

    /**
     * This Test is about delegation
     * All value dedicated for the security configuration have to be specified here:
     * createSecurityConfig() inside tests/testAccount/generateAccounts.ts
     */
    it("should delegate amend post message correctly", async () => {
        if (!ephemeralAccount.eth.privateKey || !ephemeralAccount.eth1.privateKey)
            throw Error("Can not retrieve privateKey inside ephemeralAccount.json");

        const owner = ethereum.ImportAccountFromPrivateKey(ephemeralAccount.eth.privateKey);
        const guest = ethereum.ImportAccountFromPrivateKey(ephemeralAccount.eth1.privateKey);

        const originalPost = await post.Publish({
            channel: "TEST",
            account: owner,
            postType: "testing_delegate",
            content: { body: "First content" },
        });

        await aggregate.Publish({
            account: owner,
            key: "security",
            content: {
                authorizations: [
                    {
                        address: guest.address,
                        types: ephemeralAccount.security.types,
                        aggregate_keys: ephemeralAccount.security.aggregate_keys,
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
            account: guest,
            address: owner.address,
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

    it("should automatically switch between inline and Aleph Storage due to the message size", async () => {
        const { account } = ethereum.NewAccount();

        const postRes = await post.Publish({
            channel: "TEST",
            account: account,
            postType: "testing_oversize",
            storageEngine: ItemType.inline,
            content: { body: Buffer.alloc(60 * 2 ** 10, "a").toString() },
        });

        expect(postRes.item_type).toStrictEqual("storage");
    });
});
