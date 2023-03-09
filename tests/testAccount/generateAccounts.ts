import * as bip39 from "bip39";
import { ethers } from "ethers";
import { getKeyPair } from "../../src/accounts/avalanche";
import { EphAccount } from "./entryPoint";

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

export { createEphemeralAvax, createEphemeralEth };
