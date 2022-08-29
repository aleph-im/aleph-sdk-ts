import { ItemType } from "../../src/messages/message";
import { post, tezos } from "../index";
import { DEFAULT_API_V2 } from "../../src/global";
import { b58cencode, prefix } from "@taquito/utils";
import nacl from "tweetnacl";

describe("Tezos accounts", () => {
    it("should create a new tezos accounts", async () => {
        const { account } = await tezos.NewAccount();

        expect(account.address).not.toBe("");
        expect(await account.GetPublicKey()).not.toBe("");
    });

    it("should import an tezos accounts using a private key", async () => {
        const keyPair = nacl.sign.keyPair();
        const secretKey = b58cencode(keyPair.secretKey, prefix.edsk);
        const account = await tezos.ImportAccountFromPrivateKey(secretKey);

        expect(account.address).not.toBe("");
        expect(await account.GetPublicKey()).toBe(b58cencode(keyPair.publicKey, prefix.edpk));
    });

    it("should publish a post message correctly", async () => {
        const { account } = await tezos.NewAccount();
        const content: { body: string } = {
            body: "Hello World TEZOS",
        };

        const msg = await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "ALEPH-TEST",
            inlineRequested: true,
            storageEngine: ItemType.ipfs,
            account: account,
            postType: "custom_type",
            content: content,
        });

        expect(msg.item_hash).not.toBeUndefined();
        setTimeout(async () => {
            const amends = await post.Get({
                types: "custom_type",
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
