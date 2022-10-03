import { store } from "@aleph-sdk-ts/messages";
import { DEFAULT_API_V2 } from "@aleph-sdk-ts/core-base/dist/utils/constant";
import { expect } from "@jest/globals";

export function ArraybufferToString(ab: ArrayBuffer): string {
    return new TextDecoder().decode(ab);
}

describe("Store message retrieval", () => {
    it("should retrieve a store message correctly", async () => {
        const response = await store.Get({
            fileHash: "QmQkv43jguT5HLC8TPbYJi2iEmr4MgLgu4nmBoR4zjYb3L",
            APIServer: DEFAULT_API_V2,
        });

        const got = ArraybufferToString(response);
        const expected = "This is just a test.";

        expect(got).toBe(expected);
    });
});
