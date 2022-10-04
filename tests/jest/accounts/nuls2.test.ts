import * as bip39 from "bip39";

import { post } from "@aleph-sdk-ts/messages";
import { messageType } from "@aleph-sdk-ts/core-base";
import { utils } from "@aleph-sdk-ts/core-base";
import { expect } from "@jest/globals";
import { nuls2 } from "@aleph-sdk-ts/accounts-software-nuls2";

describe("NULS2 accounts", () => {
    it("should create a NULS2 accounts", async () => {
        const { account } = await nuls2.NewAccount();

        expect(account.address).not.toBe("");
        expect(account.GetChain()).toStrictEqual(messageType.Chain.NULS2);
    });

    it("should import a NULS2 accounts using a mnemonic", async () => {
        const mnemonic = bip39.generateMnemonic();
        const account = await nuls2.ImportAccountFromMnemonic(mnemonic);

        expect(account.address).not.toBe("");
        expect(account.GetChain()).toStrictEqual(messageType.Chain.NULS2);
    });

    it("should import a NULS2 accounts using a private key", async () => {
        const account = await nuls2.ImportAccountFromPrivateKey(
            "cc0681517ecbf8d2800f6fe237fb0af9bef8c95eaa04bfaf3a733cf144a9640c",
        );

        expect(account.address).not.toBe("");
        expect(account.address).toBe("NULSd6HgcLR5Yjc7yyMiteQZxTpuB6NYRiqWf");
    });

    it("should change NULS2 account address' prefix", async () => {
        const mnemonic = "cool install source weather mass material hope inflict nerve evil swing swamp";
        const accountOne = await nuls2.ImportAccountFromMnemonic(mnemonic, { prefix: "TEST" });
        const accountTwo = await nuls2.ImportAccountFromPrivateKey(
            "cc0681517ecbf8d2800f6fe237fb0af9bef8c95eaa04bfaf3a733cf144a9640c",
        );

        const accountOnePrefix = accountOne.address.substring(0, 3);
        const accountOneAddress = accountOne.address.substring(4, accountOne.address.length);
        const accountTwoPrefix = accountTwo.address.substring(0, 3);
        const accountTwoAddress = accountTwo.address.substring(4, accountTwo.address.length);

        expect(accountOnePrefix).not.toBe(accountTwoPrefix);
        expect(accountOneAddress).toBe(accountTwoAddress);
    });

    it("should publish a post message correctly", async () => {
        const { account } = await nuls2.NewAccount();
        const content: { body: string } = {
            body: "NULS2 post test 41",
        };

        const msg = await post.Publish({
            APIServer: utils.constant.DEFAULT_API_V2,
            channel: "TEST",
            inlineRequested: true,
            storageEngine: messageType.ItemType.ipfs,
            account: account,
            postType: "nuls",
            content: content,
        });

        setTimeout(async () => {
            const amends = await post.Get({
                types: "nuls",
                APIServer: utils.constant.DEFAULT_API_V2,
                pagination: 200,
                page: 1,
                refs: [],
                addresses: [],
                tags: [],
                hashes: [msg.item_hash],
            });
            expect(amends.posts[0].content).toStrictEqual(content);
        });
    });

    it("Should encrypt content", async () => {
        const account = await nuls2.ImportAccountFromPrivateKey(
            "cc0681517ecbf8d2800f6fe237fb0af9bef8c95eaa04bfaf3a733cf144a9640c",
        );
        const msg = Buffer.from("Nuuullss2");

        const c = account.encrypt(msg);
        expect(c).not.toBe(msg);
    });

    it("Should encrypt and decrypt content", async () => {
        const account = await nuls2.ImportAccountFromPrivateKey(
            "cc0681517ecbf8d2800f6fe237fb0af9bef8c95eaa04bfaf3a733cf144a9640c",
        );
        const msg = Buffer.from("Nuuullss2");

        const c = account.encrypt(msg);
        const d = account.decrypt(c);
        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);
    });
});
