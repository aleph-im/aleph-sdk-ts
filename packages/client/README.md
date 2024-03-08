# Aleph.im TypeScript Client

The Aleph.im TypeScript SDK provides a set of tools to interact with the Aleph.im network.
This iteration of the SDK is a complete rewrite of the original [aleph-ts-sdk](https://npmjs.com/package/aleph-ts-sdk) and splits the monolithic package into smaller, more manageable packages.

Each chain has its own package:

- [@aleph-sdk/avalanche](https://npmjs.com/package/@aleph-sdk/avalanche)
- [@aleph-sdk/cosmos](https://npmjs.com/package/@aleph-sdk/cosmos)
- [@aleph-sdk/ethereum](https://npmjs.com/package/@aleph-sdk/ethereum)
- [@aleph-sdk/ethereum-ledger](https://npmjs.com/package/@aleph-sdk/ethereum-ledger)
- [@aleph-sdk/nuls2](https://npmjs.com/package/@aleph-sdk/nuls2)
- [@aleph-sdk/solana](https://npmjs.com/package/@aleph-sdk/solana)
- [@aleph-sdk/substrate](https://npmjs.com/package/@aleph-sdk/substrate)
- [@aleph-sdk/tezos](https://npmjs.com/package/@aleph-sdk/tezos)

so that you can only install the packages and dependencies you need.

This particular client package is a wrapper arount [@aleph-sdk/message](https://npmjs.com/package/@aleph-sdk/message) and delivers a similar interface to the more developed [Python SDK](https://pypi.org/project/aleph-sdk-python/).

## Installation

The Aleph.im TypeScript SDK is available on NPM, and can be installed using `npm`:

```shell
npm install @aleph-sdk/client
```

If you want to use the `AuthenticatedAlephHttpClient` to write messages, you will also need to install the package for the chain you want to use to sign your messages:

```shell
npm install @aleph-sdk/ethereum
```

## Usage

See the official [Aleph Docs](https://docs.aleph.im/) for more information on how to use the SDK.