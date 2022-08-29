import { ItemType, BaseMessage } from "../../src/messages/message";
import { GetVerificationBuffer } from "../../src/messages";
import { post, tezos } from "../index";
import { DEFAULT_API_V2 } from "../../src/global";
import { b58cencode, b58cdecode, prefix, validateSignature, encodeExpr } from "@taquito/utils";
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

    it("should sign a tezos message correctly", async () => {
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
        expect(validateSignature(msg.signature)).toBe(3);

        const buffer = GetVerificationBuffer(msg as unknown as BaseMessage);
        const digest = encodeExpr(buffer.toString("hex"));
        const result = nacl.sign.detached.verify(
            b58cdecode(digest, prefix.expr),
            b58cdecode(msg.signature, prefix.sig),
            b58cdecode(await account.GetPublicKey(), prefix.edpk),
        );
        expect(result).toBe(true);
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
