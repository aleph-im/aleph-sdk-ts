# @aleph-sdk/ethereum
The `@aleph-sdk/ethereum` module offers functionalities to interact with Ethereum accounts within the Aleph.im ecosystem.
It allows for the creation, import, and management of Ethereum accounts and facilitates the signing of messages in compliance with Aleph.im protocols.

See [@aleph-sdk/client](https://npmjs.com/package/@aleph-sdk/client) or the [offical docs](https://docs.aleph.im) as the entrypoint for developing with aleph.im.

## Features
- Creation and import of Ethereum accounts using mnemonics or private keys.
- Integration with Ethereum wallets and providers, such as MetaMask.
- Support for signing Aleph.im messages using Ethereum accounts.
- Compatibility with BIP39 for mnemonic generation and management.

Further features are included in the [@aleph-sdk/evm](https://npmjs.com/package/@aleph-sdk/evm) dependency, such as:

- EVM signature verification
- Get ChainID
- Switch network
- A standardized wrapper for browser-based and private-key wallets
