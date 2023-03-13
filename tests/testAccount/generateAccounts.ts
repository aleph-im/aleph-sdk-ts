import * as bip39 from "bip39";
import { ethers } from "ethers";
import { getKeyPair } from "../../src/accounts/avalanche";
import { EphAccount, SecurityConfig } from "./entryPoint";
import { Secp256k1HdWallet } from "@cosmjs/amino";

async function createEphemeralEth(): Promise<{ eth: EphAccount; eth1: EphAccount }> {
    const getAccount = (): EphAccount => {
        const mnemonic = bip39.generateMnemonic();
        const { address, publicKey, privateKey } = ethers.Wallet.fromMnemonic(mnemonic);
        return {
            address,
            publicKey,
            privateKey: privateKey.substring(2),
            mnemonic,
        };
    };

    const owner = getAccount();
    const delegate = getAccount();
    return { eth: owner, eth1: delegate };
}

async function createEphemeralAvax(): Promise<{ avax: EphAccount }> {
    const keypair = await getKeyPair();

    const ephemeralAccount: EphAccount = {
        address: keypair.getAddressString(),
        publicKey: keypair.getPublicKey().toString("hex"),
        privateKey: keypair.getPrivateKey().toString("hex"),
    };
    return { avax: ephemeralAccount };
}

async function createEphemeralCSDK(): Promise<{ csdk: EphAccount }> {
    const wallet = await Secp256k1HdWallet.generate();
    const accounts = (await wallet.getAccounts())[0];

    const ephemeralAccount: EphAccount = {
        address: accounts.address,
        publicKey: Buffer.from(accounts.pubkey).toString("hex"),
        mnemonic: wallet.mnemonic,
    };
    return { csdk: ephemeralAccount };
}

/**
 * Fill all required field needed for testing a delegate action.
 */
async function createSecurityConfig(): Promise<{ security: SecurityConfig }> {
    return {
        security: {
            types: ["AGGREGATE", "POST"],
            aggregate_keys: ["amend", "testing_delegate", "delegateUpdateTest"],
        },
    };
}

export { createEphemeralAvax, createEphemeralEth, createEphemeralCSDK, createSecurityConfig };
