import { cosmos, post } from "../index";
import { DEFAULT_API_V2 } from "../../src/global";
import { ItemType } from "../../src/messages/message";
import { EphAccountList } from "../testAccount/entryPoint";
import fs from "fs";

describe("Cosmos accounts", () => {
    let ephemeralAccount: EphAccountList;

    // Import the List of Test Ephemeral test Account, throw if the list is not generated
    beforeAll(async () => {
        if (!fs.existsSync("./tests/testAccount/ephemeralAccount.json"))
            throw Error("[Ephemeral Account Generation] - Error, please run: npm run test:regen");
        ephemeralAccount = await import("../testAccount/ephemeralAccount.json");
        if (!ephemeralAccount.avax.privateKey)
            throw Error("[Ephemeral Account Generation] - Generated Account corrupted");
    });

    it("should import an cosmos accounts using a mnemonic", async () => {
        const refAccount = await cosmos.NewAccount();
        const cloneAccount = await cosmos.ImportAccountFromMnemonic(refAccount.mnemonic);

        expect(refAccount.account.address).toBe(cloneAccount.address);
    });

    it("should publish a post message correctly", async () => {
        const { mnemonic } = ephemeralAccount.csdk;
        if (!mnemonic) throw Error("Can not retrieve privateKey inside ephemeralAccount.json");

        const account = await cosmos.ImportAccountFromMnemonic(mnemonic);
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
                hashes: [msg.item_hash],
                types: "cosmos",
            });
            expect(amends.posts.length).toBeGreaterThan(0);
            // expect(amends.posts[0].content).toStrictEqual(content);
        });
    });
});
