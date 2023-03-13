import { ItemType } from "../../../src/messages/message";
import { DEFAULT_API_V2 } from "../../../src/global";
import { aggregate, ethereum } from "../../index";
import { EphAccountList } from "../../testAccount/entryPoint";
import fs from "fs";

describe("Aggregate message update test", () => {
    let ephemeralAccount: EphAccountList;

    // Import the List of Test Ephemeral test Account, throw if the list is not generated
    beforeAll(async () => {
        if (!fs.existsSync("./tests/testAccount/ephemeralAccount.json"))
            throw Error("[Ephemeral Account Generation] - Error, please run: npm run test:regen");
        ephemeralAccount = await import("../../testAccount/ephemeralAccount.json");
        if (!ephemeralAccount.eth.privateKey)
            throw Error("[Ephemeral Account Generation] - Generated Account corrupted");
    });

    it("should publish and update an aggregate message", async () => {
        const { privateKey } = ephemeralAccount.eth;
        if (!privateKey) throw Error("Can not retrieve privateKey inside ephemeralAccount.json");

        const account = ethereum.ImportAccountFromPrivateKey(privateKey);
        const key = "updateTest";

        const content: { A: number } = {
            A: 1,
        };
        const UpdatedContent: { A: number } = {
            A: 10,
        };

        await aggregate.Publish({
            account: account,
            key: key,
            content: content,
            channel: "TEST",
            APIServer: DEFAULT_API_V2,
            inlineRequested: true,
            storageEngine: ItemType.inline,
        });

        const updated = await aggregate.Publish({
            account: account,
            key: key,
            content: UpdatedContent,
            channel: "TEST",
            APIServer: DEFAULT_API_V2,
            inlineRequested: true,
            storageEngine: ItemType.inline,
        });

        type T = {
            [key]: {
                A: number;
            };
        };
        const message = await aggregate.Get<T>({
            APIServer: DEFAULT_API_V2,
            address: account.address,
            keys: [key],
        });

        const expected = {
            A: 10,
        };

        expect(message.updateTest).toStrictEqual(expected);
        expect(message.updateTest).toStrictEqual(updated.content.content);
    });

    /**
     * This Test is about delegation
     * All value dedicated for the security configuration have to be specified here:
     * createSecurityConfig() inside tests/testAccount/generateAccounts.ts
     */
    it("should allow an delegate call update", async () => {
        if (!ephemeralAccount.eth.privateKey || !ephemeralAccount.eth1.privateKey)
            throw Error("Can not retrieve privateKey inside ephemeralAccount.json");

        const owner = ethereum.ImportAccountFromPrivateKey(ephemeralAccount.eth.privateKey);
        const guest = ethereum.ImportAccountFromPrivateKey(ephemeralAccount.eth1.privateKey);

        const key = "delegateUpdateTest";
        const content: { A: number } = {
            A: 1,
        };
        const UpdatedContent: { A: number } = {
            A: 10,
        };

        await aggregate.Publish({
            account: owner,
            key: key,
            content: content,
            channel: "TEST",
            APIServer: DEFAULT_API_V2,
            inlineRequested: true,
            storageEngine: ItemType.inline,
        });
        await aggregate.Publish({
            account: owner,
            key: "security",
            content: {
                authorizations: [
                    {
                        address: guest.address,
                        types: ephemeralAccount.security.types,
                        aggregate_keys: ephemeralAccount.security.aggregate_keys,
                    },
                ],
            },
            channel: "security",
            APIServer: DEFAULT_API_V2,
            inlineRequested: true,
            storageEngine: ItemType.inline,
        });

        const updated = await aggregate.Publish({
            account: guest,
            address: owner.address,
            key: key,
            content: UpdatedContent,
            channel: "TEST",
            APIServer: DEFAULT_API_V2,
            inlineRequested: true,
            storageEngine: ItemType.storage,
        });

        type T = {
            [key]: {
                A: number;
            };
        };
        const message = await aggregate.Get<T>({
            APIServer: DEFAULT_API_V2,
            address: owner.address,
            keys: [key],
        });

        const expected = {
            A: 10,
        };

        expect(message.delegateUpdateTest).toStrictEqual(expected);
        expect(message.delegateUpdateTest).toStrictEqual(updated.content.content);
    });
});
