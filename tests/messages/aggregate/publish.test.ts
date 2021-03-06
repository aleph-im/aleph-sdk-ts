import { ItemType } from "../../../src/messages/message";
import { DEFAULT_API_V2 } from "../../../src/global";
import { aggregate, ethereum } from "../../index";

const mnemonic = "exit canvas recycle vault excite battle short roof unlock limb attract device";

describe("Aggregate message publish test", () => {
    it("should publish an aggregate message", async () => {
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);
        const key = "satoshi";

        const content: { A: number } = {
            A: 1,
        };

        const res = await aggregate.Publish({
            account: account,
            key: key,
            content: content,
            channel: "TEST",
            APIServer: DEFAULT_API_V2,
            inlineRequested: true,
            storageEngine: ItemType.storage,
        });

        type T = {
            satoshi: {
                A: number;
            };
        };
        const message = await aggregate.Get<T>({
            APIServer: DEFAULT_API_V2,
            address: account.address,
            keys: [key],
        });

        const expected = {
            A: 1,
        };

        expect(message.satoshi).toStrictEqual(expected);
        expect(message.satoshi).toStrictEqual(res.content.content);
    });
});
