import { ItemType, MessageType } from "../../src/messages/types";
import { post, solana } from "../index";
import { Keypair } from "@solana/web3.js";
import { panthomLikeProvider, officialLikeProvider } from "../providers/solanaProvider";
import { verifySolana } from "../index";
import { GetVerificationBuffer } from "../../src/messages";
import { EphAccountList } from "../testAccount/entryPoint";
import fs from "fs";

describe("Solana accounts", () => {
    let ephemeralAccount: EphAccountList;

    // Import the List of Test Ephemeral test Account, throw if the list is not generated
    beforeAll(async () => {
        if (!fs.existsSync("./tests/testAccount/ephemeralAccount.json"))
            throw Error("[Ephemeral Account Generation] - Error, please run: npm run test:regen");
        ephemeralAccount = await import("../testAccount/ephemeralAccount.json");
        if (!ephemeralAccount.avax.privateKey)
            throw Error("[Ephemeral Account Generation] - Generated Account corrupted");
    });

    it("should import an solana accounts using a private key", () => {
        const { address, privateKey } = ephemeralAccount.sol;
        if (!privateKey) throw Error("Can not retrieve privateKey inside ephemeralAccount.json");
        const accountFromPrivateKey = solana.ImportAccountFromPrivateKey(Buffer.from(privateKey, "hex"));

        expect(address).toStrictEqual(accountFromPrivateKey.address);
    });

    it("should import an solana accounts using a provider", async () => {
        const randomKeypair = new Keypair();
        const providerPhantom = new panthomLikeProvider(randomKeypair);
        const providerOfficial = new officialLikeProvider(randomKeypair);
        const accountSecretKey = await solana.ImportAccountFromPrivateKey(randomKeypair.secretKey);
        const accountPhantom = await solana.GetAccountFromProvider(providerPhantom);
        const accountOfficial = await solana.GetAccountFromProvider(providerOfficial);

        expect(accountSecretKey.address).toStrictEqual(accountPhantom.address);
        expect(accountOfficial.address).toStrictEqual(accountPhantom.address);
    });

    it("should get the same signed message for each account", async () => {
        const randomKeypair = new Keypair();
        const providerPhantom = new panthomLikeProvider(randomKeypair);
        const providerOfficial = new officialLikeProvider(randomKeypair);
        const accountSecretKey = await solana.ImportAccountFromPrivateKey(randomKeypair.secretKey);
        const accountPhantom = await solana.GetAccountFromProvider(providerPhantom);
        const accountOfficial = await solana.GetAccountFromProvider(providerOfficial);

        const message = {
            chain: accountSecretKey.GetChain(),
            sender: accountSecretKey.address,
            type: MessageType.post,
            channel: "TEST",
            confirmed: true,
            signature: "signature",
            size: 15,
            time: 15,
            item_type: ItemType.storage,
            item_content: "content",
            item_hash: "hash",
            content: { address: accountSecretKey.address, time: 15 },
        };

        expect(accountSecretKey.Sign(message)).toStrictEqual(accountPhantom.Sign(message));
        expect(accountOfficial.Sign(message)).toStrictEqual(accountPhantom.Sign(message));
    });

    it("should publish a post message correctly", async () => {
        const { privateKey } = ephemeralAccount.sol;
        if (!privateKey) throw Error("Can not retrieve privateKey inside ephemeralAccount.json");
        const account = solana.ImportAccountFromPrivateKey(Buffer.from(privateKey, "hex"));

        const content: { body: string } = {
            body: "This message was posted from the typescript-SDK test suite with SOL",
        };

        const msg = await post.Publish({
            channel: "TEST",
            account: account,
            postType: "solana",
            content: content,
        });

        expect(msg.item_hash).not.toBeUndefined();
        setTimeout(async () => {
            const amends = await post.Get({
                types: "solana",
                hashes: [msg.item_hash],
            });
            expect(amends.posts[0].content).toStrictEqual(content);
        });
    });

    it("Should success to verif the authenticity of a signature", async () => {
        const { account } = solana.NewAccount();

        const message = {
            chain: account.GetChain(),
            sender: account.address,
            type: MessageType.post,
            channel: "TEST",
            confirmed: true,
            signature: "signature",
            size: 15,
            time: 15,
            item_type: ItemType.storage,
            item_content: "content",
            item_hash: "hash",
            content: { address: account.address, time: 15 },
        };
        const signature = await account.Sign(message);
        const verifA = verifySolana(message, signature);
        const verifB = verifySolana(GetVerificationBuffer(message), signature);

        expect(verifA).toStrictEqual(true);
        expect(verifB).toStrictEqual(true);
    });

    it("Should fail to verif the authenticity of a signature", async () => {
        const { account } = solana.NewAccount();

        const message = {
            chain: account.GetChain(),
            sender: account.address,
            type: MessageType.post,
            channel: "TEST",
            confirmed: true,
            signature: "signature",
            size: 15,
            time: 15,
            item_type: ItemType.storage,
            item_content: "content",
            item_hash: "hash",
            content: { address: account.address, time: 15 },
        };
        const fakeMessage = {
            ...message,
            item_hash: "FAKE",
        };
        const fakeSignature = await account.Sign(fakeMessage);
        const verif = verifySolana(message, JSON.stringify({ signature: fakeSignature, publicKey: account.address }));

        expect(verif).toStrictEqual(false);
    });
});
