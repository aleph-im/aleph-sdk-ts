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

        await setTimeout(async () => {
            await post.Publish({
                APIServer: DEFAULT_API_V2,
                channel: "TEST",
                inlineRequested: false,
                storageEngine: ItemType.ipfs,
                account: account,
                postType: postType,
                content: content,
            });
        });

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
        expect(Fres.content).not.toBeNull();
    });
});
