import { avalanche } from "../index";

describe("Avalanche accounts", () => {
    it("should create a new Avalanche account", async () => {
        const { account } = await avalanche.NewAccount();

        expect(account.address).not.toBe("");
        expect(account.publicKey).not.toBe("");
    });

    it("should retreive an avalanche keypair from a private key", async () => {
        const { account, privateKey } = await avalanche.NewAccount();

        if (privateKey) {
            const accountFromPK = await avalanche.ImportAccountFromPrivateKey(privateKey);
            expect(account.publicKey).toBe(accountFromPK.publicKey);
        } else {
            fail();
        }
    });

    it("Should encrypt some data with an Avalanche keypair", async () => {
        const { account } = await avalanche.NewAccount();
        const msg = Buffer.from("Laŭ Ludoviko Zamenhof bongustas freŝa ĉeĥa manĝaĵo kun spicoj");

        const c = account.encrypt(msg);
        expect(c).not.toBe(msg);
    });

    it("Should encrypt and decrypt some data with an Avalanche keypair", async () => {
        const { account } = await avalanche.NewAccount();
        const msg = Buffer.from("Laŭ Ludoviko Zamenhof bongustas freŝa ĉeĥa manĝaĵo kun spicoj");

        const c = account.encrypt(msg);
        const d = account.decrypt(c);

        expect(d).toStrictEqual(msg);
    });
});
