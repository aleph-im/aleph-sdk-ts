import { readFileSync } from "fs";

import { store } from "@aleph-sdk-ts/messages";
import { ethereum } from "@aleph-sdk-ts/accounts-software-ethereum";
import { ItemType } from "@aleph-sdk-ts/core-base/dist/messages";
import { DEFAULT_API_V2 } from "@aleph-sdk-ts/core-base/dist/utils/constant";
import { expect } from "@jest/globals";

export function ArraybufferToString(ab: ArrayBuffer): string {
    return new TextDecoder().decode(ab);
}

describe("Store message publish", () => {
    it("should store a file and retrieve it correctly", async () => {
        const mnemonic = "twenty enough win warrior then fiction smoke tenant juice lift palace inherit";
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);
        const fileContent = readFileSync("./tests/jest/messages/store/testFile.txt");

        const hash = await store.Publish({
            channel: "TEST",
            APIServer: DEFAULT_API_V2,
            account: account,
            storageEngine: ItemType.storage,
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
});
