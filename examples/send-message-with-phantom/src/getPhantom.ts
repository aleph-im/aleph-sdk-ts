export const getPhantom = () => {
    if ("phantom" in window) {
        const provider = window.phantom?.solana;

        if (provider?.isPhantom) {
            return provider;
        }
    }
};
