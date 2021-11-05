import * as bip39 from "bip39";
import { nuls, post } from "../index";
import { ChainType } from "../../src/accounts/account";
import { DEFAULT_API_V2 } from "../../src/global";
import { StorageEngine } from "../../src/messages/message";

describe("NULS accounts", () => {
    it("should create a NULS accounts", async () => {
        const { account } = await nuls.NewAccount();

        expect(account.address).not.toBe("");
        expect(account.publicKey).not.toBe("");
        expect(account.GetChain()).toStrictEqual(ChainType.NULS);
    });

    it("should import a NULS accounts using a mnemonic", async () => {
        const mnemonic = bip39.generateMnemonic();
        const account = await nuls.ImportAccountFromMnemonic(mnemonic);

        expect(account.address).not.toBe("");
        expect(account.publicKey).not.toBe("");
        expect(account.GetChain()).toStrictEqual(ChainType.NULS);
    });

    it("should import a NULS accounts using a private key", async () => {
        const account = await nuls.ImportAccountFromPrivateKey(
            "cc0681517ecbf8d2800f6fe237fb0af9bef8c95eaa04bfaf3a733cf144a9640c",
        );

        expect(account.address).not.toBe("");
        expect(account.publicKey).toBe("02a7e23f579821364bf186b2ee0fb2aa9e5faa57cd4f281599ca242d8d9faa8533");
        expect(account.address).toBe("6HgcLR5Yjc7yyMiteQZxTpuB6NYRiqWf");
    });

    it("should publish a post message correctly", async () => {
        const { account } = await nuls.NewAccount();
        const content: { body: string } = {
            body: "NULS post test 12",
        };

        const msg = await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            inlineRequested: true,
            storageEngine: StorageEngine.IPFS,
            account: account,
            postType: "chat",
            content: content,
        });

        expect(msg.item_hash).not.toBeNull();

        const amends = await post.Get({
            types: "chat",
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
