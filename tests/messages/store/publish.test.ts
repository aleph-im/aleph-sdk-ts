import { ethereum, store } from "../../index";
import { DEFAULT_API_V2 } from "../../../src/global";
import { ItemType } from "../../../src/messages/message";
import { readFileSync } from "fs";

export function ArraybufferToString(ab: ArrayBuffer): string {
    return new TextDecoder().decode(ab);
}

describe("Store message publish", () => {
    it("should store a file and retrieve it correctly", async () => {
        const mnemonic = "twenty enough win warrior then fiction smoke tenant juice lift palace inherit";
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);
        const fileContent = readFileSync("./tests/messages/store/testFile.txt");

        const hash = await store.Publish({
            channel: "TEST",
            account: account,
            fileObject: fileContent,
        });

        const response = await store.Get({
            fileHash: hash.content.item_hash,
            APIServer: DEFAULT_API_V2,
        });

        const got = ArraybufferToString(response);
        const expected = "y";

        expect(got).toBe(expected);
    });

    it("should pin a file and retrieve it correctly", async () => {
        const mnemonic = "twenty enough win warrior then fiction smoke tenant juice lift palace inherit";
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);
        const helloWorldHash = "QmTp2hEo8eXRp6wg7jXv1BLCMh5a4F3B7buAUZNZUu772j";

        const hash = await store.Pin({
            channel: "TEST",
            account: account,
            fileHash: helloWorldHash,
        });

        const response = await store.Get({
            fileHash: hash.content.item_hash,
            APIServer: DEFAULT_API_V2,
        });

        const got = ArraybufferToString(response);
        const expected = "hello world!";

        expect(got).toBe(expected);
    });

    it("should fail to pin a file at runtime", async () => {
        const mnemonic = "twenty enough win warrior then fiction smoke tenant juice lift palace inherit";
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);

        const helloWorldHash = "QmTp2hEo8eXRp6wg7jXv1BLCMh5a4F3B7buAUZNZUu772j";
        const fileContent = readFileSync("./tests/messages/store/testFile.txt");

        await expect(
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            store.Publish({
                channel: "TEST",
                APIServer: DEFAULT_API_V2,
                account: account,
                storageEngine: ItemType.storage,
                fileObject: fileContent,
                fileHash: helloWorldHash,
            }),
        ).rejects.toThrow("You can't pin a file and upload it at the same time.");

        await expect(
            store.Publish({
                channel: "TEST",
                APIServer: DEFAULT_API_V2,
                account: account,
                storageEngine: ItemType.storage,
                fileHash: helloWorldHash,
            }),
        ).rejects.toThrow("You must choose ipfs to pin file.");

        await expect(
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            store.Publish({
                channel: "TEST",
                APIServer: DEFAULT_API_V2,
                account: account,
                storageEngine: ItemType.storage,
            }),
        ).rejects.toThrow("You need to specify a File to upload or a Hash to pin.");
    });
});
