import * as bip39 from "bip39";
import { nuls } from "../index";
import { Chain } from "../../src/messages/message";

describe("NULS accounts", () => {
    it("should create a NULS accounts", async () => {
        const { account } = await nuls.NewAccount();

        expect(account.address).not.toBe("");
        expect(account.GetChain()).toStrictEqual(Chain.NULS);
    });

    it("should import a NULS accounts using a mnemonic", async () => {
        const mnemonic = bip39.generateMnemonic();
        const account = await nuls.ImportAccountFromMnemonic(mnemonic);

        expect(account.address).not.toBe("");
        expect(account.GetChain()).toStrictEqual(Chain.NULS);
    });

    it("should import a NULS accounts using a private key", async () => {
        const account = await nuls.ImportAccountFromPrivateKey(
            "cc0681517ecbf8d2800f6fe237fb0af9bef8c95eaa04bfaf3a733cf144a9640c",
        );

        expect(account.address).not.toBe("");
        expect(account.address).toBe("6HgcLR5Yjc7yyMiteQZxTpuB6NYRiqWf");
    });

    it("Should encrypt content", async () => {
        const account = await nuls.ImportAccountFromPrivateKey(
            "cc0681517ecbf8d2800f6fe237fb0af9bef8c95eaa04bfaf3a733cf144a9640c",
        );
        const msg = Buffer.from("Nuuullss");

        const c = account.encrypt(msg);
        expect(c).not.toBe(msg);
    });

    it("Should encrypt and decrypt content", async () => {
        const account = await nuls.ImportAccountFromPrivateKey(
            "cc0681517ecbf8d2800f6fe237fb0af9bef8c95eaa04bfaf3a733cf144a9640c",
        );
        const msg = Buffer.from("Nuuullss");

        const c = account.encrypt(msg);
        const d = account.decrypt(c);
        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);
    });
});
