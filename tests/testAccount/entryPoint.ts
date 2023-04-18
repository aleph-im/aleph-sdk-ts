import {
    createEphemeralAvax,
    createEphemeralEth,
    createEphemeralCSDK,
    createSecurityConfig,
    createEphemeralNULS2,
    createEphemeralSol,
    createEphemeralTezos,
    createEphemeralPolkadot,
} from "./generateAccounts";
import fs from "fs";

export type EphAccount = {
    address: string;
    publicKey: string;
    privateKey?: string;
    mnemonic?: string;
};

export type SecurityConfig = {
    types: string[];
    aggregate_keys: string[];
};

/**
 * @eth: Main Ethereum account
 * @eth1: Account that will receive right from the fist account to perform delegate calls
 * @avax: Main Alavanche account
 * @csdk: Main Cosmos account
 * @nuls2: Main NULS2 account
 */
export type EphAccountList = {
    security: SecurityConfig;
    eth: EphAccount;
    eth1: EphAccount;
    avax: EphAccount;
    csdk: EphAccount;
    nuls2: EphAccount;
    sol: EphAccount;
    tezos: EphAccount;
    polkadot: EphAccount;
};

function displayUsage() {
    console.log("[Ephemeral Account generation]");
    console.log("Usage:");
    console.log("ts-node tests/testAccount/entryPoint.ts");
    console.log("Optional param:");
    console.log("-r forced a generation of a new account");
}

async function main() {
    const arg = process.argv[2];
    if (!!arg && arg !== "-r") displayUsage();

    if (!fs.existsSync("./tests/testAccount/ephemeralAccount.json") || process.argv[2] === "-r") {
        const genFunctions = [
            createEphemeralEth,
            createEphemeralAvax,
            createEphemeralCSDK,
            createEphemeralSol,
            createEphemeralTezos,
            createEphemeralPolkadot,
            createEphemeralNULS2,
            createSecurityConfig,
        ];

        const arrayOfEphAccounts = await Promise.all(
            genFunctions.map(async (el: () => Promise<{ [key: string]: EphAccount | SecurityConfig }>) => await el()),
        );
        const listOfEphAccounts = Object.assign({}, ...arrayOfEphAccounts);

        const jsonAccount = JSON.stringify(listOfEphAccounts, null, 4);
        fs.writeFileSync("./tests/testAccount/ephemeralAccount.json", jsonAccount);
        console.log(
            "[Ephemeral Account generation] - An Ephemeral account was generated here: ./tests/testAccount/ephemeralAccount.json",
        );
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
