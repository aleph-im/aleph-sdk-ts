import { ethereum, avalanche, nuls2 } from "../index";

describe("EciesAccount accounts", () => {
    const mnemonicA = "mystery hole village office false satisfy divert cloth behave slim cloth carry";
    const PkeyB = "c5754d886b30da1368706e77d6c401e9c7c02f92200d33ad51622cf25dc62acd";

    it("Should test a ETH-AVAX message encryption", async () => {
        const accountA = ethereum.ImportAccountFromMnemonic(mnemonicA);
        const accountB = await avalanche.ImportAccountFromPrivateKey(PkeyB);
        const msg = Buffer.from("Innovation");

        const c = await accountA.encrypt(msg, accountB);
        const d = await accountB.decrypt(c);
        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);
    });

    it("Should test a AVAX-ETH message encryption", async () => {
        const accountA = await avalanche.ImportAccountFromPrivateKey(PkeyB);
        const accountB = ethereum.ImportAccountFromMnemonic(mnemonicA);
        const msg = Buffer.from("Innovation");

        const c = await accountA.encrypt(msg, accountB);
        const d = await accountB.decrypt(c);
        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);
    });

    it("Should test an ETH-NULS2 message encryption", async () => {
        const accountA = ethereum.ImportAccountFromMnemonic(mnemonicA);
        const accountB = await nuls2.ImportAccountFromPrivateKey(PkeyB);
        const msg = Buffer.from("Innovation");

        const c = await accountA.encrypt(msg, accountB);
        const d = await accountB.decrypt(c);
        expect(c).not.toBe(msg);
        expect(d).toStrictEqual(msg);
    });
});
