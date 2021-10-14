import * as bip39 from "bip39";
import { mnemonicToMiniSecret } from "@polkadot/util-crypto";
import assert from "assert";
import { accounts, DEFAULT_API_V2, aggregate } from "../../src";
import { StorageEngine } from "../../src/messages/message";

async function createAccountTest(): Promise<boolean> {
    const account = await accounts.substrate.NewAccount();

    try {
        assert.notStrictEqual(account.address, "");
        assert.notStrictEqual(account.publicKey, "");
    } catch (e: unknown) {
        console.error(`createAccountTest: ${e}`);
        return false;
    }
    return true;
}

async function importAccountFromMnemonicTest(): Promise<boolean> {
    const mnemonic = bip39.generateMnemonic();
    const account = await accounts.substrate.ImportAccountFromMnemonic(mnemonic);

    try {
        assert.notStrictEqual(account.address, "");
        assert.notStrictEqual(account.publicKey, "");
    } catch (e: unknown) {
        console.error(`importAccountFromMnemonicTest: ${e}`);
        return false;
    }
    return true;
}

async function importAccountFromPrivateKeyTest(): Promise<boolean> {
    const mnemonic = bip39.generateMnemonic();
    const account = await accounts.substrate.ImportAccountFromMnemonic(mnemonic);
    const secretKey = `0x${Buffer.from(mnemonicToMiniSecret(mnemonic)).toString("hex")}`;
    const importedAccount = await accounts.substrate.ImportAccountFromPrivateKey(secretKey);

    try {
        assert.strictEqual(account.address, importedAccount.address);
        assert.notStrictEqual(importedAccount.publicKey, "");
    } catch (e: unknown) {
        console.error(`importAccountFromPrivateKeyTest: ${e}`);
        return false;
    }
    return true;
}

async function PublishAggregate(): Promise<boolean> {
    const account = await accounts.substrate.NewAccount();
    const key = "cheer";
    const content: { body: string } = {
        body: "Hello From TS SDK with Substrate !",
    };

    await aggregate.Publish({
        account: account,
        key: key,
        content: content,
        channel: "TEST",
        storageEngine: StorageEngine.IPFS,
        inlineRequested: true,
        APIServer: DEFAULT_API_V2,
    });

    type exceptedType = {
        cheer: {
            body: string;
        };
    };
    const amends = await aggregate.Get<exceptedType>({
        APIServer: DEFAULT_API_V2,
        address: account.address,
        keys: [key],
    });

    try {
        assert.strictEqual(amends.cheer.body, content.body);
    } catch (e: unknown) {
        console.error(`PublishPostMessage: ${e}`);
        return false;
    }
    return true;
}

export default function substrateTests(): void {
    createAccountTest();
    importAccountFromMnemonicTest();
    importAccountFromPrivateKeyTest();
    PublishAggregate();
}
