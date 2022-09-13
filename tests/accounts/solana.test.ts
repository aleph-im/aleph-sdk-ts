import { Chain, ItemType, MessageType } from "../../src/messages/message";
import { post, solana } from "../index";
import { DEFAULT_API_V2 } from "../../src/global";

import { Keypair } from "@solana/web3.js";
import { panthomLikeProvider, officialLikeProvider } from "../provider/solanaProvider";

describe("Solana accounts", () => {
    it("should import an solana accounts using a private key", () => {
        const { account, privateKey } = solana.NewAccount();
        const accountFromPrivateKey = solana.ImportAccountFromPrivateKey(privateKey);

        expect(account.address).toStrictEqual(accountFromPrivateKey.address);
        expect(account.GetChain()).toStrictEqual(Chain.SOL);
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
        const { account } = solana.NewAccount();
        const content: { body: string } = {
            body: "This message was posted from the typescript-SDK test suite with SOL",
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
});
