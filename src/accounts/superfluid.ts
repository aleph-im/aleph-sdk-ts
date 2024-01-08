import { Framework, WrapperSuperToken } from "@superfluid-finance/sdk-core";
import { AvalancheAccount } from "./avalanche";
import { ChainData, JsonRPCWallet, RpcChainType } from "./providers/JsonRPCWallet";
import { ethers } from "ethers";
import { ALEPH_SUPERFLUID_FUJI_TESTNET } from "../global";
import { Decimal } from "decimal.js";

/**
 * SuperfluidAccount implements the Account class for the Superfluid protocol.
 * It is used to represent a Superfluid account when publishing a message on the Aleph network.
 */

export class SuperfluidAccount extends AvalancheAccount {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    public override wallet: JsonRPCWallet;
    private framework?: Framework;
    private alephx?: WrapperSuperToken;

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
                this.alephx = await this.framework.loadWrapperSuperToken(ALEPH_SUPERFLUID_FUJI_TESTNET);
            } else {
                throw new Error("Only Fuji Testnet is supported for now");
            }
        }
    }

    private alephToWei(alephAmount: Decimal): ethers.BigNumber {
        return ethers.BigNumber.from(alephAmount).mul(ethers.BigNumber.from(10).pow(18));
    }

    private weiToAleph(weiAmount: ethers.BigNumber | string): Decimal {
        return new Decimal(ethers.utils.formatEther(ethers.BigNumber.from(weiAmount)));
    }

    private alephPerHourToFlowRate(alephPerHour: Decimal): ethers.BigNumber {
        return this.alephToWei(alephPerHour).div(ethers.BigNumber.from(3600));
    }

    private flowRateToAlephPerHour(flowRate: ethers.BigNumber | string): Decimal {
        return new Decimal(ethers.utils.formatEther(ethers.BigNumber.from(flowRate).mul(ethers.BigNumber.from(3600))));
    }

    public async approveALEPH(receiver: string, amount: Decimal): Promise<void> {
        if (!this.wallet) throw Error("PublicKey Error: No providers are set up");
        if (!this.alephx) throw new Error("Account not initialized");
        const op = this.alephx.approve({
            receiver,
            amount: this.alephToWei(amount).toString(),
        });
        await op.exec(this.wallet.provider.getSigner());
    }

    public async getALEPHAllowance(receiver: string): Promise<Decimal> {
        if (!this.wallet) throw Error("PublicKey Error: No providers are set up");
        if (!this.alephx) throw new Error("Account not initialized");
        const allowance = await this.alephx.allowance({
            owner: this.address,
            spender: receiver,
            providerOrSigner: this.wallet.provider,
        });
        return this.weiToAleph(allowance);
    }

    /**
     * Get the regular ALEPH balance of the account.
     */
    public async getALEPHBalance(): Promise<Decimal> {
        // @todo: implement
        return new Decimal(0);
    }

    public async getALEPHxBalance(): Promise<Decimal> {
        if (!this.wallet) throw Error("PublicKey Error: No providers are set up");
        if (!this.alephx) throw new Error("Account not initialized");
        const balance = await this.alephx.balanceOf({ account: this.address, providerOrSigner: this.wallet.provider });
        return this.weiToAleph(balance);
    }

    public async wrapALEPH(amount: Decimal): Promise<void> {
        if (!this.wallet) throw Error("PublicKey Error: No providers are set up");
        if (!this.alephx) throw new Error("Account not initialized");
        const op = this.alephx.upgrade({
            amount: this.alephToWei(amount).toString(),
        });
        await op.exec(this.wallet.provider.getSigner());
    }

    public async unwrapALEPHx(amount: Decimal): Promise<void> {
        if (!this.wallet) throw Error("PublicKey Error: No providers are set up");
        if (!this.alephx) throw new Error("Account not initialized");
        const op = this.alephx.downgrade({
            amount: this.alephToWei(amount).toString(),
        });
        await op.exec(this.wallet.provider.getSigner());
    }

    /**
     * Get the ALEPHx flow rate to a given receiver in ALEPHx per hour.
     * @param receiver The receiver address.
     */
    public async getALEPHxFlow(receiver: string): Promise<Decimal> {
        if (!this.wallet) throw Error("PublicKey Error: No providers are set up");
        if (!this.alephx) throw new Error("Account not initialized");
        const flow = await this.alephx.getFlow({
            sender: this.address,
            receiver,
            providerOrSigner: this.wallet.provider,
        });
        if (!flow) {
            return new Decimal(0);
        } else {
            return this.flowRateToAlephPerHour(flow.flowRate);
        }
    }
    public async getNetALEPHxFlow(): Promise<Decimal> {
        if (!this.wallet) throw Error("PublicKey Error: No providers are set up");
        if (!this.alephx) throw new Error("Account not initialized");
        const flow = await this.alephx.getNetFlow({
            account: this.address,
            providerOrSigner: this.wallet.provider,
        });
        return this.flowRateToAlephPerHour(flow);
    }

    public async increaseALEPHxFlow(receiver: string, flowRate: ethers.BigNumber): Promise<void> {
        if (!this.wallet) throw Error("PublicKey Error: No providers are set up");
        if (!this.alephx) throw new Error("Account is not initialized");
        const flow = await this.alephx.getFlow({
            sender: this.address,
            receiver,
            providerOrSigner: this.wallet.provider,
        });
        // check wrapped balance, if none throw
        const balance = ethers.BigNumber.from(
            await this.alephx.balanceOf({ account: this.address, providerOrSigner: this.wallet.provider }),
        );
        if (balance.lt(flowRate)) {
            throw new Error("Not enough ALEPHx to increase flow");
        }
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

    public async decreaseALEPHxFlow(receiver: string, flowRate: ethers.BigNumber): Promise<void> {
        if (!this.wallet) throw Error("PublicKey Error: No providers are set up");
        if (!this.alephx) throw new Error("Account not initialized");
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
