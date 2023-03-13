import * as bip39 from "bip39";
import { ethers } from "ethers";
import { getKeyPair } from "../../src/accounts/avalanche";
import { EphAccount, SecurityConfig } from "./entryPoint";
import { Secp256k1HdWallet } from "@cosmjs/amino";
import { nuls2, solana, tezos } from "../index";
import * as bip32 from "bip32";
import { b58cencode, prefix } from "@taquito/utils";

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

async function createEphemeralTezos(): Promise<{ tezos: EphAccount }> {
    const { signerAccount, privateKey } = await tezos.NewAccount();
    const publicKey = await signerAccount.GetPublicKey();

    const ephemeralAccount: EphAccount = {
        address: signerAccount.address,
        publicKey,
        privateKey: b58cencode(privateKey, prefix.edsk),
    };
    return { tezos: ephemeralAccount };
}

async function createEphemeralSol(): Promise<{ sol: EphAccount }> {
    const { account, privateKey } = solana.NewAccount();

    const ephemeralAccount: EphAccount = {
        address: account.address,
        publicKey: account.address,
        privateKey: Buffer.from(privateKey).toString("hex"),
    };
    return { sol: ephemeralAccount };
}

async function createEphemeralNULS2(): Promise<{ nuls2: EphAccount }> {
    const account = await nuls2.NewAccount();
    const v = await bip39.mnemonicToSeed(account.mnemonic);
    const b = bip32.fromSeed(v);

    if (!b || !b.privateKey) throw new Error("could not import from mnemonic");
    const privateKey = b.privateKey.toString("hex");

    const ephemeralAccount: EphAccount = {
        address: account.account.address,
        publicKey: account.account.publicKey,
        mnemonic: account.mnemonic,
        privateKey,
    };
    return { nuls2: ephemeralAccount };
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

export {
    createEphemeralAvax,
    createEphemeralEth,
    createEphemeralCSDK,
    createSecurityConfig,
    createEphemeralSol,
    createEphemeralNULS2,
    createEphemeralTezos,
};
