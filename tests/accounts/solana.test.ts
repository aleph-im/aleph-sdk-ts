import * as solanajs from "@solana/web3.js";
import { ItemType } from "../../src/messages/message";
import { post, solana } from "../index";
import { DEFAULT_API_V2 } from "../../src/global";
import nacl from "tweetnacl";
import base58 from "bs58";

describe("Solana accounts", () => {
    it("should create a new solana accounts", () => {
        const { account } = solana.NewAccount();

        expect(account.address).not.toBe("");
        expect(account.publicKey).not.toBe("");
    });

    it("should import an solana accounts using a private key", () => {
        const keyPair = new solanajs.Keypair();
        const account = solana.ImportAccountFromPrivateKey(keyPair.secretKey);

        expect(account.address).not.toBe("");
        expect(account.publicKey).toBe(keyPair.publicKey.toString());
    });

    it("should publish a post message correctly", async () => {
        const { account } = solana.NewAccount();
        const content: { body: string } = {
            body: "Hello World 21",
        };

        const msg = await post.Publish({
            APIServer: DEFAULT_API_V2,
            channel: "TEST",
            inlineRequested: true,
            storageEngine: ItemType.ipfs,
            account: account,
            postType: "custom_type",
            content: content,
        });

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
        }, 1000);
    });

    it("Should encrypt content", async () => {
        const { account } = solana.NewAccount();
        const msg = Buffer.from("solana en avant les histoires");

        const c = await account.encrypt(msg);
        expect(c).not.toBe(msg);
    });

    it("Should encrypt and decrypt content", async () => {
        const { account } = solana.NewAccount();
        const msg = Buffer.from("solana en avant les histoires");

        const c = await account.encrypt(msg);
        const d = await account.decrypt(c);
        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);
    });

    it("Should not be decryptable with the public key", async () => {
        const { account } = solana.NewAccount();
        const msg = Buffer.from("solana en avant les histoires");

        const c = await account.encrypt(msg);
        const opts = {
            nonce: c.slice(0, nacl.box.nonceLength),
            ciphertext: c.slice(nacl.box.nonceLength),
        };
        const d = nacl.box.open(
            opts.ciphertext,
            opts.nonce,
            base58.decode(account.publicKey),
            base58.decode(account.publicKey),
        );
        expect(d).toBeNull();
    });
});
