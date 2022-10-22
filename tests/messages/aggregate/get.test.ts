import { aggregate } from "../../index";
import { DEFAULT_API_V2 } from "../../../src/global";

describe("Aggregate message retrieve test", () => {
    it("should retrieve an existing aggregate message", async () => {
        type T = {
            satoshi: {
                A: number;
            };
        };
        const key = "satoshi";
        const address = "0x629fBDA22F485720617C8f1209692484C0359D43";

        const message = await aggregate.Get<T>({
            APIServer: DEFAULT_API_V2,
            address: address,
            keys: [key],
        });

        const expected = {
            A: 1,
        };

        expect(message.satoshi).toStrictEqual(expected);
    });

    it("should retrieve an existing aggregate message without specifies side params", async () => {
        type T = {
            satoshi: {
                A: number;
            };
        };
        const address = "0x629fBDA22F485720617C8f1209692484C0359D43";

        const message = await aggregate.Get<T>({
            address: address,
        });

        const expected = {
            A: 1,
        };

        expect(message.satoshi).toStrictEqual(expected);
    });

    it("should failed to retrieve an aggregate message", async () => {
        type T = {
            satoshi: {
                A: number;
            };
        };
        const key = "satoshi";
        const address = "0x629xBDA22F485720617C8f1209692484C0358D43";

        await expect(
            aggregate.Get<T>({
                APIServer: DEFAULT_API_V2,
                address: address,
                keys: [key],
            }),
        ).rejects.toThrow();
    });

    it("should print the CCN list correctly (testing #87)", async () => {
        const message = await aggregate.Get({
            address: "0xa1B3bb7d2332383D96b7796B908fB7f7F3c2Be10",
            keys: ["corechannel"],
        });

        expect(message).toHaveProperty("corechannel");
    });
});
