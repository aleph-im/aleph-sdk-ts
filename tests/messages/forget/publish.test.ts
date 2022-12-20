import { ItemType } from "../../../src/messages/message";
import { ethereum, forget, post } from "../../index";
import { DEFAULT_API_V2 } from "../../../src/global";

describe("Forget publish tests", () => {
    const mnemonic = "mystery hole village office false satisfy divert cloth behave slim cloth carry";
    const postType = "TS Forget Test";
    const content: { body: string } = {
        body: "This message will be destroyed",
    };

    it("should post a message which will be forget", async () => {
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);

        const res = await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            inlineRequested: true,
            storageEngine: ItemType.inline,
            account: account,
            postType: postType,
            content: content,
        });

        const Fres = await forget.Publish({
            channel: "TEST",
            hashes: [res.item_hash],
            inlineRequested: true,
            account: account,
        });
        expect(Fres.content).not.toBeNull();
    });

    it("Forget a message using storage engine", async () => {
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);

        const res = await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            inlineRequested: true,
            storageEngine: ItemType.inline,
            account: account,
            postType: postType,
            content: content,
        });

        const Fres = await forget.Publish({
            channel: "TEST",
            hashes: [res.item_hash],
            inlineRequested: false,
            storageEngine: ItemType.storage,
            account: account,
        });

        const initialPost = await post.Get({ types: postType, hashes: [res.item_hash] });

        expect(Fres.content).not.toBeNull();
        expect(initialPost.posts.length).toStrictEqual(0);
    });
});
