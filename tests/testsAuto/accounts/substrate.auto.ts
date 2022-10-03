import * as bip39 from "bip39";
import assert = require("assert");
import { mnemonicToMiniSecret } from "@polkadot/util-crypto";

import { testsFunc } from "../index";
import { aggregate } from "@aleph-sdk-ts/messages";
import { DEFAULT_API_V2 } from "@aleph-sdk-ts/core-base/dist/utils/constant";
import { ItemType } from "@aleph-sdk-ts/core-base/dist/messages";
import { substrate } from "@aleph-sdk-ts/accounts-software-substrate";

/**
 * This is the first test of the test bach for substrate.
 * It should create a new substrate account and check if it worked.
 *
 * For the assertion comparison, the `assert` standard library is used.
 * If the assertion failed, you must catch the error message and display it while returning false.
 */
async function createAccountTest(): Promise<boolean> {
    const { account } = await substrate.NewAccount();

    try {
        assert.notStrictEqual(account.address, "");
    } catch (e: unknown) {
        console.error(`createAccountTest: ${e}`);
        return false;
    }
    return true;
}

async function importAccountFromMnemonicTest(): Promise<boolean> {
    const mnemonic = bip39.generateMnemonic();
    const account = await substrate.ImportAccountFromMnemonic(mnemonic);

    try {
        assert.notStrictEqual(account.address, "");
    } catch (e: unknown) {
        console.error(`importAccountFromMnemonicTest: ${e}`);
        return false;
    }
    return true;
}

async function importAccountFromPrivateKeyTest(): Promise<boolean> {
    const mnemonic = bip39.generateMnemonic();
    const account = await substrate.ImportAccountFromMnemonic(mnemonic);
    const secretKey = `0x${Buffer.from(mnemonicToMiniSecret(mnemonic)).toString("hex")}`;
    const importedAccount = await substrate.ImportAccountFromPrivateKey(secretKey);

    try {
        assert.strictEqual(account.address, importedAccount.address);
    } catch (e: unknown) {
        console.error(`importAccountFromPrivateKeyTest: ${e}`);
        return false;
    }
    return true;
}

async function PublishAggregate(): Promise<boolean> {
    const { account } = await substrate.NewAccount();
    const key = "cheer";
    const content: { body: string } = {
        body: "Typescript sdk",
    };

    await aggregate.Publish({
        account: account,
        key: key,
        content: content,
        channel: "TEST",
        storageEngine: ItemType.ipfs,
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

async function encrypt(): Promise<boolean> {
    const account = await substrate.ImportAccountFromMnemonic(
        "immune orbit beyond retire marble clog shiver ice illegal tomorrow antenna tennis",
    );
    const msg = Buffer.from("Nuuullss");

    try {
        const c = account.encrypt(msg);
        assert.notStrictEqual(c, msg);
    } catch (e: unknown) {
        console.error(`importAccountFromMnemonicTest: ${e}`);
        return false;
    }
    return true;
}

async function encryptNDecrypt(): Promise<boolean> {
    const account = await substrate.ImportAccountFromMnemonic(
        "immune orbit beyond retire marble clog shiver ice illegal tomorrow antenna tennis",
    );
    const msg = Buffer.from("Innovation");

    try {
        const c = account.encrypt(msg);
        const d = account.decrypt(c);
        assert.notStrictEqual(c, msg);
        assert.deepEqual(d, msg);
    } catch (e: unknown) {
        console.error(`importAccountFromMnemonicTest: ${e}`);
        return false;
    }
    return true;
}

/**
 * SubstrateTests controls the flow of your custom tests for substrate protocol.
 * Every test is represented by a function related to the `testsFunc` Type.
 * The array `testBatch` Contains all the customs tests functions in a predefined order.
 *
 * Every test will be executed in order, then a boolean according to the failure or success of your batch
 * will be returned.
 *
 * In order to produce a new test bach you have to copy this function in a new file with
 * an appropriate name, import `assert` library and `testsFunc` type.
 */
export default async function substrateTests(): Promise<boolean> {
    let passed = true;
    let res: boolean;
    const testBatch: testsFunc[] = [
        createAccountTest,
        importAccountFromMnemonicTest,
        importAccountFromPrivateKeyTest,
        PublishAggregate,
        encrypt,
        encryptNDecrypt,
    ];

    for (let i = 0; i < testBatch.length; i++) {
        res = await testBatch[i]();
        console.log(`Test [${i + 1}-${res ? "Success" : "Failure"}]\t${testBatch[i].name}`);
        passed = res ? passed : false;
    }
    return passed;
}
