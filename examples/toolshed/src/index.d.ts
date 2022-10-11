import { MetaMaskInpageProvider } from "@metamask/providers";
import { Keplr } from "@keplr-wallet/types";

declare global {
    interface Window {
        ethereum: MetaMaskInpageProvider;
        keplr: Keplr;
        phantom: any;
    }
}
