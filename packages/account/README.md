# @aleph-sdk/account
This package provides common interface definitions for blockchain accounts compatible with aleph.im, including abstract classes for standard and ECIES accounts, and a base provider wallet abstraction.
It is designed to be extended for specific blockchain protocols such as Ethereum and Solana.

See [@aleph-sdk/client](https://npmjs.com/package/@aleph-sdk/client) or the [offical docs](https://docs.aleph.im) as the entrypoint for developing with aleph.im.

## Features
- Abstract Account class for implementing protocol-related accounts.
- Abstract ECIESAccount class for accounts using secp256k1's curve, with encryption capabilities.
- Abstract BaseProviderWallet for interaction with browser-based providers & wallets.
