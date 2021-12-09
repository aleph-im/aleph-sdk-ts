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
        const fileContent = readFileSync("./tests/messages/store/testFile.txt", "utf-8");

        const hash = await store.Publish({
            channel: "TEST",
            APIServer: DEFAULT_API_V2,
            account: account,
            storageEngine: ItemType.ipfs,
            fileObject: fileContent,
        });

        const response = await store.Get({
            fileHash: hash,
            APIServer: DEFAULT_API_V2,
        });

        const got = ArraybufferToString(response);
        const expected = "y";

        expect(got).toBe(expected);
    });
});
