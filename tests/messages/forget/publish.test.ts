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

        const msg = await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            inlineRequested: true,
            storageEngine: ItemType.ipfs,
            account: account,
            postType: postType,
            content: content,
        });

        setTimeout(async () => {
            const res = await post.Get({
                types: postType,
                APIServer: DEFAULT_API_V2,
                pagination: 200,
                page: 1,
                refs: [],
                addresses: [],
                tags: [],
                hashes: [msg.item_hash],
            });
            expect(content).toStrictEqual(res.posts[0].content);
        });
    });

    it("Should submit a forget message on a specified account", async () => {
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);

        const Gres = await post.Get({
            types: postType,
            APIServer: DEFAULT_API_V2,
            pagination: 200,
            page: 1,
            refs: [],
            addresses: [account.address],
            tags: [],
            hashes: [],
        });

        const Fres = await forget.publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            hashes: [Gres.posts[0].hash],
            inlineRequested: true,
            storageEngine: ItemType.ipfs,
            account: account,
        });

        expect(Gres.posts[0].hash).toBe(Fres.content.hashes[0]);
    });
});
