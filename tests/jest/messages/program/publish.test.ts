import { readFileSync } from "fs";
import { program } from "@aleph-sdk-ts/messages";
import { ItemType } from "@aleph-sdk-ts/core-base/dist/messages";

import { DEFAULT_API_V2 } from "@aleph-sdk-ts/core-base/dist/utils/constant";
import { expect } from "@jest/globals";

import { ethereum } from "@aleph-sdk-ts/accounts-software-ethereum";
export function ArraybufferToString(ab: ArrayBuffer): string {
    return new TextDecoder().decode(ab);
}

describe("Test the program message", () => {
    it("Publish a program retrieve the message", async () => {
        const mnemonic = "twenty enough win warrior then fiction smoke tenant juice lift palace inherit";
        const account = ethereum.ImportAccountFromMnemonic(mnemonic);

        const fileContent = readFileSync("./tests/jest/messages/program/main.py.zip");

        const res = await program.Publish({
            account: account,
            channel: "TEST",
            APIServer: DEFAULT_API_V2,
            inlineRequested: false,
            storageEngine: ItemType.ipfs,
            file: fileContent,
            entrypoint: "main:app",
        });

        expect(res.content.code.entrypoint).toBe("main:app");
        expect(res.content.address).toBe(account.address);
    });
});
