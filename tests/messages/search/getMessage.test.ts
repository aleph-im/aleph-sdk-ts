import { search } from "../../index";
import { StoreMessage } from "../../../src/messages/message";

describe("Test features from GetMessages", () => {
    it("Try to retrieve a message with GetMessage", async () => {
        const res = await search.GetMessage<StoreMessage>({
            hash: "87e1e2ee2cbe88fa2923042b84b2f9c69410005ca7dd40193838bf9bad18e12c",
        });

        expect(res.content.item_hash).toStrictEqual("QmZyVbZm6Ffs9syXs8pycGbWiTa9yiGoX1b9FSFpTjaixK");
    });

    it("If a specific message does not existe, it should failed", async () => {
        await expect(
            search.GetMessage<StoreMessage>({
                hash: "w87e1e2ee2cbe88fa2923042b84b2f9c694w10005ca7dd40193838bf9bad18e12cw",
            }),
        ).rejects.toThrow(
            "The message w87e1e2ee2cbe88fa2923042b84b2f9c694w10005ca7dd40193838bf9bad18e12cw was not found",
        );
    });
});
