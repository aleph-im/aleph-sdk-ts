import { ItemType } from "../../../src/messages/message";
import { ethereum, forget, post } from "../../index";
import { DEFAULT_API_V2 } from "../../../src/global";
import { EphAccountList } from "../../testAccount/entryPoint";
import fs from "fs";

describe("Forget publish tests", () => {
    let ephemeralAccount: EphAccountList;
    const postType = "TS Forget Test";
    const content: { body: string } = {
        body: "This message will be destroyed",
    };

    // Import the List of Test Ephemeral test Account, throw if the list is not generated
    beforeAll(async () => {
        if (!fs.existsSync("./tests/testAccount/ephemeralAccount.json"))
            throw Error("[Ephemeral Account Generation] - Error, please run: npm run test:regen");
        ephemeralAccount = await import("../../testAccount/ephemeralAccount.json");
        if (!ephemeralAccount.eth.privateKey)
            throw Error("[Ephemeral Account Generation] - Generated Account corrupted");
    });

    it("should post a message which will be forget", async () => {
        const { mnemonic } = ephemeralAccount.eth;
        if (!mnemonic) throw Error("Can not retrieve mnemonic inside ephemeralAccount.json");
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);

        const res = await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            storageEngine: ItemType.inline,
            account: account,
            postType: postType,
            content: content,
        });

        const Fres = await forget.Publish({
            channel: "TEST",
            hashes: [res.item_hash],
            account: account,
        });
        expect(Fres.content).not.toBeNull();
    });

    it("Forget a message using storage engine", async () => {
        const { mnemonic } = ephemeralAccount.eth;
        if (!mnemonic) throw Error("Can not retrieve mnemonic inside ephemeralAccount.json");
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);

        const res = await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            storageEngine: ItemType.inline,
            account: account,
            postType: postType,
            content: content,
        });

        const Fres = await forget.Publish({
            channel: "TEST",
            hashes: [res.item_hash],
            storageEngine: ItemType.storage,
            account: account,
        });

        const initialPost = await post.Get({ types: postType, hashes: [res.item_hash] });

        expect(Fres.content).not.toBeNull();
        expect(initialPost.posts.length).toStrictEqual(0);
    });
});
