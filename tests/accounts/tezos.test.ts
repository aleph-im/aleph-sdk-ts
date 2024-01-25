/**
 * @jest-environment jsdom
 */
import { ItemType, MessageType } from "../../src/messages/types";
import { post, tezos } from "../index";
import { DEFAULT_API_V2 } from "../../src/global";
import { b58cencode, prefix, validateSignature } from "@taquito/utils";
import { EphAccountList } from "../testAccount/entryPoint";
import fs from "fs";
import { verifyTezos } from "../index";

if (!window) {
    require("localstorage-polyfill");
}

describe("Tezos accounts", () => {
    let ephemeralAccount: EphAccountList;

    // Import the List of Test Ephemeral test Account, throw if the list is not generated
    beforeAll(async () => {
        if (!fs.existsSync("./tests/testAccount/ephemeralAccount.json"))
            throw Error("[Ephemeral Account Generation] - Error, please run: npm run test:regen");
        ephemeralAccount = await import("../testAccount/ephemeralAccount.json");
        if (!ephemeralAccount.avax.privateKey)
            throw Error("[Ephemeral Account Generation] - Generated Account corrupted");
    });

    it("should create a new tezos accounts", async () => {
        const { signerAccount } = await tezos.NewAccount();

        expect(signerAccount.address).not.toBe("");
        expect(await signerAccount.GetPublicKey()).not.toBe("");
    });

    it("should import an tezos accounts using a private key", async () => {
        const { signerAccount, privateKey } = await tezos.NewAccount();
        const account = await tezos.ImportAccountFromPrivateKey(b58cencode(privateKey, prefix.edsk));

        expect(account.address).toStrictEqual(signerAccount.address);
    });

    it("should sign a tezos message with InMemorySigner correctly", async () => {
        const { privateKey } = ephemeralAccount.tezos;
        if (!privateKey) throw Error("Can not retrieve privateKey inside ephemeralAccount.json");

        const signerAccount = await tezos.ImportAccountFromPrivateKey(privateKey);
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
        const { privateKey } = ephemeralAccount.tezos;
        if (!privateKey) throw Error("Can not retrieve privateKey inside ephemeralAccount.json");
        const signerAccount = await tezos.ImportAccountFromPrivateKey(privateKey);
        const content: { body: string } = {
            body: "Hello World TEZOS",
        };

        const msg = await post.Publish({
            channel: "TEST",
            account: signerAccount,
            postType: "tezos",
            content: content,
        });

        expect(msg.item_hash).not.toBeUndefined();
        setTimeout(async () => {
            const amends = await post.Get({
                types: "tezos",
                hashes: [msg.item_hash],
            });
            expect(amends.posts[0].content).toStrictEqual(content);
        });
    });

    it("Should success to verif the authenticity of a signature", async () => {
        const { signerAccount } = await tezos.NewAccount();

        const message = {
            chain: signerAccount.GetChain(),
            sender: signerAccount.address,
            type: MessageType.post,
            channel: "TEST",
            confirmed: true,
            signature: "signature",
            size: 15,
            time: 15,
            item_type: ItemType.storage,
            item_content: "content",
            item_hash: "hash",
            content: { address: signerAccount.address, time: 15 },
        };
        const signature = await signerAccount.Sign(message);
        const verifA = await verifyTezos(message, signature);

        expect(verifA).toStrictEqual(true);
    });

    it("Should fail to verif the authenticity of a signature", async () => {
        const { signerAccount } = await tezos.NewAccount();

        const message = {
            chain: signerAccount.GetChain(),
            sender: signerAccount.address,
            type: MessageType.post,
            channel: "TEST",
            confirmed: true,
            signature: "signature",
            size: 15,
            time: 15,
            item_type: ItemType.storage,
            item_content: "content",
            item_hash: "hash",
            content: { address: signerAccount.address, time: 15 },
        };
        const fakeMessage = {
            ...message,
            item_hash: "FAKE",
        };
        const signature = await signerAccount.Sign(message);
        const fakeSignature = await signerAccount.Sign(fakeMessage);

        const verifA = verifyTezos(fakeMessage, signature);
        const verifB = verifyTezos(message, fakeSignature);

        expect(verifA).toStrictEqual(false);
        expect(verifB).toStrictEqual(false);
    });
});
