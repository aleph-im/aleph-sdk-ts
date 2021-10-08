import { ethereum } from "../../../src/accounts/index";
import { aggregate, DEFAULT_API_V2 } from "../../../src";
import { StorageEngine } from "../../../src/messages/message";

const mnemonic = "exit canvas recycle vault excite battle short roof unlock limb attract device";

describe("Aggregate message publish test", () => {
    it("should publish an aggregate message", async () => {
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);
        const key = "satoshi";

        const content: { A: number } = {
            A: 1,
        };

        await aggregate.Publish({
            account: account,
            key: key,
            content: content,
            channel: "TEST",
            APIServer: DEFAULT_API_V2,
            inlineRequested: true,
            storageEngine: StorageEngine.STORAGE,
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
    });
});
