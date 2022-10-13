import { ethereum, store } from "../../../tests";
import { DEFAULT_API_V2 } from "../../../src/global";
import { ItemType } from "../../../src/messages/message";

function ArraybufferToString(ab) {
    return new TextDecoder().decode(ab);
}

describe("My First Test", () => {
    it("Does not do much!", () => {
        const mnemonic = "mystery hole village office false satisfy divert cloth behave slim cloth carry";
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);
        const msg = Buffer.from("Innovation");

        const c = account.encrypt(msg);
        expect(c).not.eq(msg);
    });

    it("should store a file and retrieve it correctly", async () => {
        const mnemonic = "twenty enough win warrior then fiction smoke tenant juice lift palace inherit";
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);
        const fileContent = Buffer.from("y");

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

        expect(got).eq(expected);
    });
});
