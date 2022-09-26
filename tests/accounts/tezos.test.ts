/**
 * @jest-environment jsdom
 */
import { ItemType } from "../../src/messages/message";
import { post, tezos } from "../index";
import { DEFAULT_API_V2 } from "../../src/global";
import { b58cencode, prefix, validateSignature } from "@taquito/utils";
import nacl from "tweetnacl";

if (!window) {
    require("localstorage-polyfill");
}

describe("Tezos accounts", () => {
    it("should create a new tezos accounts", async () => {
        const { signerAccount } = await tezos.NewAccount();

        expect(signerAccount.address).not.toBe("");
        expect(await signerAccount.GetPublicKey()).not.toBe("");
    });

    it("should import an tezos accounts using a private key", async () => {
        const keyPair = nacl.sign.keyPair();
        const secretKey = b58cencode(keyPair.secretKey, prefix.edsk);
        const account = await tezos.ImportAccountFromPrivateKey(secretKey);

        expect(account.address).not.toBe("");
        expect(await account.GetPublicKey()).toBe(b58cencode(keyPair.publicKey, prefix.edpk));
    });

    it("should sign a tezos message with InMemorySigner correctly", async () => {
        const { signerAccount } = await tezos.NewAccount();
        const content: { body: string } = {
            body: "Hello World InMemorySigner TEZOS",
        };
        const msg = await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "ALEPH-TEST",
            inlineRequested: true,
            storageEngine: ItemType.ipfs,
            account: signerAccount,
            postType: "tezos",
            content: content,
        });
        const sigInfo = JSON.parse(msg.signature);
        expect(sigInfo.dAppUrl).not.toBeUndefined();
        expect(sigInfo.signingType).toEqual("micheline");
        const signature = sigInfo.signature;
        expect(validateSignature(signature)).toBe(3);
    });

    it("should publish a post message correctly", async () => {
        const { signerAccount } = await tezos.NewAccount();
        const content: { body: string } = {
            body: "Hello World TEZOS",
        };

        const msg = await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "ALEPH-TEST",
            inlineRequested: true,
            storageEngine: ItemType.ipfs,
            account: signerAccount,
            postType: "tezos",
            content: content,
        });

        expect(msg.item_hash).not.toBeUndefined();
        setTimeout(async () => {
            const amends = await post.Get({
                types: "tezos",
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
