import { ItemType } from "../../../src/messages/message";
import { DEFAULT_API_V2 } from "../../../src/global";
import { aggregate, ethereum } from "../../index";

describe("Aggregate message update test", () => {
    it("should publish and update an aggregate message", async () => {
        const { account } = ethereum.NewAccount();
        const key = "satoshi";

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
            storageEngine: ItemType.inline,
        });

        const updated = await aggregate.Publish({
            account: account,
            key: key,
            content: UpdatedContent,
            channel: "TEST",
            APIServer: DEFAULT_API_V2,
            storageEngine: ItemType.inline,
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
            A: 10,
        };

        expect(message.satoshi).toStrictEqual(expected);
        expect(message.satoshi).toStrictEqual(updated.content.content);
    });

    it("should allow an delegate call update", async () => {
        const owner = ethereum.NewAccount();
        const guest = ethereum.NewAccount();

        const key = "satoshi";
        const content: { A: number } = {
            A: 1,
        };
        const UpdatedContent: { A: number } = {
            A: 10,
        };

        await aggregate.Publish({
            account: owner.account,
            key: key,
            content: content,
            channel: "TEST",
            APIServer: DEFAULT_API_V2,
            storageEngine: ItemType.inline,
        });
        await aggregate.Publish({
            account: owner.account,
            key: "security",
            content: {
                authorizations: [
                    {
                        address: guest.account.address,
                        types: ["AGGREGATE"],
                        aggregate_keys: [key],
                    },
                ],
            },
            channel: "security",
            APIServer: DEFAULT_API_V2,
            storageEngine: ItemType.inline,
        });

        const updated = await aggregate.Publish({
            account: guest.account,
            address: owner.account.address,
            key: key,
            content: UpdatedContent,
            channel: "TEST",
            APIServer: DEFAULT_API_V2,
            storageEngine: ItemType.storage,
        });

        type T = {
            satoshi: {
                A: number;
            };
        };
        const message = await aggregate.Get<T>({
            APIServer: DEFAULT_API_V2,
            address: owner.account.address,
            keys: [key],
        });

        const expected = {
            A: 10,
        };

        expect(message.satoshi).toStrictEqual(expected);
        expect(message.satoshi).toStrictEqual(updated.content.content);
    });
});
