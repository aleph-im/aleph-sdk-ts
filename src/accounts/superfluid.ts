import { Framework, SuperToken } from "@superfluid-finance/sdk-core";
import { AvalancheAccount } from "./avalanche";
import { ChainData, JsonRPCWallet, RpcChainType } from "./providers/JsonRPCWallet";
import { ethers } from "ethers";
import { ALEPH_SUPERFLUID_FUJI_TESTNET } from "../global";

/**
 * SuperfluidAccount implements the Account class for the Superfluid protocol.
 * It is used to represent a Superfluid account when publishing a message on the Aleph network.
 */

export class SuperfluidAccount extends AvalancheAccount {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    public override wallet: JsonRPCWallet;
    private framework?: Framework;
    private alephx?: SuperToken;

    constructor(wallet: JsonRPCWallet, address: string, publicKey?: string) {
        super(wallet, address, publicKey);
    }

    public async init(): Promise<void> {
        if (!this.wallet) throw Error("PublicKey Error: No providers are set up");
        if (!this.framework) {
            this.framework = await Framework.create({
                chainId: await this.wallet.getCurrentChainId(),
                provider: this.wallet,
            });
        }
        if (!this.alephx) {
            if (ChainData[RpcChainType.AVAX_TESTNET].chainIdDec === (await this.wallet.getCurrentChainId())) {
                this.alephx = await this.framework.loadSuperToken(ALEPH_SUPERFLUID_FUJI_TESTNET);
            } else {
                throw new Error("Only Fuji Testnet is supported for now");
            }
        }
    }

    public async approveALEPH(receiver: string, amount: ethers.BigNumber): Promise<void> {
        if (!this.wallet) throw Error("PublicKey Error: No providers are set up");
        if (!this.alephx) throw new Error("SuperToken not initialized");
        const op = this.alephx.approve({
            receiver,
            amount: amount.toString(),
        });
        await op.exec(this.wallet.provider.getSigner());
    }

    public async getALEPHAllowance(receiver: string): Promise<ethers.BigNumber> {
        if (!this.wallet) throw Error("PublicKey Error: No providers are set up");
        if (!this.alephx) throw new Error("SuperToken not initialized");
        const allowance = await this.alephx.allowance({
            owner: this.address,
            spender: receiver,
            providerOrSigner: this.wallet.provider,
        });
        return ethers.BigNumber.from(allowance.toString());
    }

    public async getALEPHBalance(): Promise<ethers.BigNumber> {
        if (!this.wallet) throw Error("PublicKey Error: No providers are set up");
        if (!this.alephx) throw new Error("SuperToken not initialized");
        const balance = await this.alephx.balanceOf({ account: this.address, providerOrSigner: this.wallet.provider });
        return ethers.BigNumber.from(balance.toString());
    }

    public async wrapALEPH(amount: ethers.BigNumber): Promise<void> {
        if (!this.wallet) throw Error("PublicKey Error: No providers are set up");
        if (!this.alephx) throw new Error("SuperToken not initialized");
        const op = await this.alephx.upgrade({
            amount: amount.toString(),
        });
        await op.exec(this.wallet.provider.getSigner());
    }

    public async getALEPHFlow(receiver: string): Promise<ethers.BigNumber> {
        if (!this.wallet) throw Error("PublicKey Error: No providers are set up");
        if (!this.alephx) throw new Error("SuperToken not initialized");
        const flow = await this.alephx.getFlow({
            sender: this.address,
            receiver,
            providerOrSigner: this.wallet.provider,
        });
        if (!flow) {
            return ethers.BigNumber.from(0);
        } else {
            return ethers.BigNumber.from(flow.flowRate.toString());
        }
    }

    public async increaseALEPHFlow(receiver: string, flowRate: ethers.BigNumber): Promise<void> {
        if (!this.wallet) throw Error("PublicKey Error: No providers are set up");
        if (!this.alephx) throw new Error("SuperToken not initialized");
        const flow = await this.alephx.getFlow({
            sender: this.address,
            receiver,
            providerOrSigner: this.wallet.provider,
        });
        if (!flow) {
            const op = this.alephx.createFlow({
                sender: this.address,
                receiver,
                flowRate: flowRate.toString(),
            });
            await op.exec(this.wallet.provider.getSigner());
        } else {
            const newFlowRate = ethers.BigNumber.from(flow.flowRate.toString()).add(flowRate);
            const op = this.alephx.updateFlow({
                sender: this.address,
                receiver,
                flowRate: newFlowRate.toString(),
            });
            await op.exec(this.wallet.provider.getSigner());
        }
    }

    public async decreaseALEPHFlow(receiver: string, flowRate: ethers.BigNumber): Promise<void> {
        if (!this.wallet) throw Error("PublicKey Error: No providers are set up");
        if (!this.alephx) throw new Error("SuperToken not initialized");
        const flow = await this.alephx.getFlow({
            sender: this.address,
            receiver,
            providerOrSigner: this.wallet.provider,
        });
        if (!flow) {
            throw new Error("Flow does not exist");
        } else {
            const newFlowRate = ethers.BigNumber.from(flow.flowRate.toString()).sub(flowRate);
            if (newFlowRate.lte(0)) {
                const op = this.alephx.deleteFlow({
                    sender: this.address,
                    receiver,
                });
                await op.exec(this.wallet.provider.getSigner());
            } else {
                const op = this.alephx.updateFlow({
                    sender: this.address,
                    receiver,
                    flowRate: newFlowRate.toString(),
                });
                await op.exec(this.wallet.provider.getSigner());
            }
        }
    }
}

export function createFromAvalancheAccount(account: AvalancheAccount, rpc?: string): SuperfluidAccount {
    if (account.wallet) {
        return new SuperfluidAccount(account.wallet, account.address, account.publicKey);
    }
    throw new Error("Wallet is required");
    // @todo: implement for node.js
    if (!rpc) throw new Error("RPC or Provider is required");
    if (!account.keyPair) throw new Error("KeyPair is required");

    const rpcProvider = new ethers.providers.JsonRpcProvider(rpc);
    const provider = new JsonRPCWallet(rpcProvider);
    return new SuperfluidAccount(provider, account.address, account.publicKey);
}
