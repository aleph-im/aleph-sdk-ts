import { aggregate } from "@aleph-sdk-ts/messages";
import { utils } from "@aleph-sdk-ts/core-base";
import { expect } from "@jest/globals";

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
            APIServer: utils.constant.DEFAULT_API_V2,
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
});
