import { accountTests, testsFunc } from "./index";

/**
 *  launchTestsAuto represents the entry point of testsAuto.
 *  It launches all of your customs test batches that you provide in the `testBatch` array.
 *
 *  For each custom test batches a message will be written in the console according to the name of the test batch
 *  followed by the result of each test contained in the suits.
 *
 *  All tests will be computed with their result displayed in the console.
 *  Then, the program will exit with either an error or success status.
 *
 *  Look at `testsAuto/accounts/substrate.auto.ts` to learn more about making custom test.
 */
async function launchTestsAuto(): Promise<void> {
    let passed = true;
    const testBatch: testsFunc[] = [accountTests.substrateTests.default];

    for (let i = 0; i < testBatch.length; i++) {
        console.log(`---Starting: ${testBatch[i].name}`);
        passed = (await testBatch[i]()) ? passed : false;
    }
    if (!passed) process.exit(1);
    else process.exit(0);
}

launchTestsAuto();
