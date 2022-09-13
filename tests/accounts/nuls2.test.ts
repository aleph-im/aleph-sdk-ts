import { nuls2, post } from "../index";
import { DEFAULT_API_V2 } from "../../src/global";
import { ItemType, Chain } from "../../src/messages/message";

describe("NULS2 accounts", () => {
    const testprivateKey = "cc0681517ecbf8d2800f6fe237fb0af9bef8c95eaa04bfaf3a733cf144a9640c";

    it("should import a NULS2 accounts using a mnemonic", async () => {
        const { account, mnemonic } = await nuls2.NewAccount();
        const accountFromMnemoic = await nuls2.ImportAccountFromMnemonic(mnemonic);

        expect(accountFromMnemoic.address).toStrictEqual(account.address);
        expect(account.GetChain()).toStrictEqual(Chain.NULS2);
    });

    it("should import a NULS2 accounts using a private key", async () => {
        const account = await nuls2.ImportAccountFromPrivateKey(testprivateKey);

        expect(account.GetChain()).toStrictEqual(Chain.NULS2);
        expect(account.address).toStrictEqual("NULSd6HgcLR5Yjc7yyMiteQZxTpuB6NYRiqWf");
    });

    it("Should encrypt and decrypt content with NULS2", async () => {
        const account = await nuls2.ImportAccountFromPrivateKey(testprivateKey);
        const msg = Buffer.from("Nuuullss2");

        const c = account.encrypt(msg);
        const d = account.decrypt(c);
        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);
    });

    it("should change NULS2 account address' prefix", async () => {
        const mnemonic = "cool install source weather mass material hope inflict nerve evil swing swamp";
        const accountOne = await nuls2.ImportAccountFromMnemonic(mnemonic, { prefix: "TEST" });
        const accountTwo = await nuls2.ImportAccountFromPrivateKey(testprivateKey);

        const accountOnePrefix = accountOne.address.substring(0, 3);
        const accountOneAddress = accountOne.address.substring(4, accountOne.address.length);
        const accountTwoPrefix = accountTwo.address.substring(0, 3);
        const accountTwoAddress = accountTwo.address.substring(4, accountTwo.address.length);

        expect(accountOnePrefix).not.toBe(accountTwoPrefix);
        expect(accountOneAddress).toStrictEqual(accountTwoAddress);
    });

    it("should publish a post message correctly", async () => {
        const { account } = await nuls2.NewAccount();
        const content: { body: string } = {
            body: "This message was posted from the typescript-SDK test suite with ETH",
        };

        const msg = await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            inlineRequested: true,
            storageEngine: ItemType.ipfs,
            account: account,
            postType: "Ralph",
            content: content,
        });

        setTimeout(async () => {
            const amends = await post.Get({
                types: "Ralph",
                APIServer: DEFAULT_API_V2,
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
});
