import { BaseMessage, GetVerificationBuffer, MessageType, StorageEngine } from "../../src/messages/message";
import { ChainType } from "../../src/accounts/account";
import { DEFAULT_API_V2 } from "../../src/global";
import { aggregate, near } from "../index";
import { sha256 } from "js-sha256";
import nacl from "tweetnacl";
import base58 from "bs58";

describe("Near accounts", () => {
    it("should import an account from a private key", async () => {
        const account = await near.ImportAccountFromPrivateKey(
            "testnet",
            "thewinnie.testnet",
            "5ZcDQZjegV4JBQjVkWzaehq8f3fviWVyRkN89JbjFenWFN5RgRnGr7QNYdfMmjfkgy4sg9pBu3bKSDRJFUeovgjn",
        );

        expect(account.address).toBe("thewinnie.testnet:7KRctNKvQbDFxT6QhvUHgznCqEJtQvQohzjsZ9fPrjaC");
        expect(account.publicKey).toBe("ed25519:7KRctNKvQbDFxT6QhvUHgznCqEJtQvQohzjsZ9fPrjaC");
    });

    it("should sign a message with near account and verify it", async () => {
        const account = await near.ImportAccountFromPrivateKey(
            "testnet",
            "thewinnie.testnet",
            "5ZcDQZjegV4JBQjVkWzaehq8f3fviWVyRkN89JbjFenWFN5RgRnGr7QNYdfMmjfkgy4sg9pBu3bKSDRJFUeovgjn",
        );

        const base: BaseMessage = {
            chain: ChainType.NEAR,
            channel: "TEST",
            confirmed: false,
            item_content: "",
            item_hash: "",
            item_type: StorageEngine.STORAGE,
            sender: "",
            signature: "",
            size: 0,
            time: 0,
            type: MessageType.Post,
        };

        const nearSigned = await account.Sign(base);
        const signatureParsed = JSON.parse(nearSigned);
        const valid = nacl.sign.detached.verify(
            new Uint8Array(sha256.array(GetVerificationBuffer(base))),
            base58.decode(signatureParsed.signature),
            base58.decode(signatureParsed.publicKey),
        );
        expect(nearSigned).not.toBeNull();
        expect(valid).toBe(true);
    });

    it("should publish an aggregate message", async () => {
        const account = await near.ImportAccountFromPrivateKey(
            "testnet",
            "thewinnie.testnet",
            "5ZcDQZjegV4JBQjVkWzaehq8f3fviWVyRkN89JbjFenWFN5RgRnGr7QNYdfMmjfkgy4sg9pBu3bKSDRJFUeovgjn",
        );
        const key = "neeaarr";

        const content: { A: number } = {
            A: 1,
        };

        await aggregate.Publish({
            account: account,
            key: key,
            content: content,
            channel: "TEST",
            APIServer: DEFAULT_API_V2,
            inlineRequested: true,
            storageEngine: StorageEngine.STORAGE,
        });

        type T = {
            satoshi: {
                A: number;
            };
        };
        const message = await aggregate.Get<T>({
            APIServer: DEFAULT_API_V2,
            address: account.address,
            keys: [key],
        });

        const expected = {
            A: 1,
        };

        expect(message.satoshi).toStrictEqual(expected);
    });
});
