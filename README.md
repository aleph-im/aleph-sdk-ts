# aleph-sdk-ts

## Description

This SDK offers binding to interact with the [Aleph decentralized network](https://aleph.im/).

Written in TypeScript, it's designed to replace the [aleph-js library](https://github.com/aleph-im/aleph-js) and works seamlessly in the browser, on Node.js servers, and within the Aleph Virtual Machine without internet access (using [socat](https://manpages.org/socat)).

## Quick Start

## Installation

To get started, install the SDK using `npm install <package>`.
Available packages are:

```shell
# Legacy (3.9.2)
aleph-sdk-ts

# Current (1.0.0 or later)
## General
@aleph-sdk/core
@aleph-sdk/account
@aleph-sdk/client
@aleph-sdk/message
@aleph-sdk/dns
## EVM chains
@aleph-sdk/evm
@aleph-sdk/ethereum
@aleph-sdk/ethereum-ledger
@aleph-sdk/avalanche
@aleph-sdk/base
@aleph-sdk/superfluid
## Non-EVM chains
@aleph-sdk/solana
@aleph-sdk/tezos
@aleph-sdk/nuls2
@aleph-sdk/cosmos
@aleph-sdk/substrate
```

## Additional Resources

- [API reference](https://aleph-im.github.io/aleph-sdk-ts/index.html): Detailed documentation for the SDK's API.
- [Aleph TS SDK Gitbook](https://aleph-im.gitbook.io/ts-sdk/): Guides and use-cases for the SDK.
- [Examples](https://github.com/aleph-im/aleph-sdk-ts/tree/main/examples): Sample code snippets demonstrating the SDK's usage.

## Supported chains

This is the list of currently supported Account types. For each of them you can:

- Retrieve an account from a **private key** or **mnemonic** (or generate one on the fly).
- Sign and send messages on the Aleph Network.
- Some allow you to retrieve an account from a **browser based** wallet (ex: Metamask), or from a **Ledger** wallet.

[Previous versions](https://npmjs.com/package/aleph-sdk-ts) of the Typescript SDK allowed you to **encrypt** messages.

| Chain                | Encryption | Browser Wallet | Ledger |
| -------------------- | ---------- | -------------- | ------ |
| Avalanche            | ❌         | ✔️             | ❌     |
| Base                 | ❌         | ✔️             | ❌     |
| Cosmos               | ❌         | ✔️             | ❌     |
| Ethereum             | ❌         | ✔️             | ✔️     |
| NULS2                | ❌         | ❌             | ❌     |
| Solana               | ❌         | ✔️             | ❌     |
| Substrate (Polkadot) | ❌         | ✔️             | ❌     |
| Tezos                | ❌         | ✔️             | ❌     |

## Running from source

To use features not yet released, clone this repository and follow these steps:

1. Install dependencies: `npm install`
2. Build packages: `npm run build`
3. Run the test suite: `npm run test`

## Environments

### Supported Node.js Versions

| Version | Supported                                |
| ------- | ---------------------------------------- |
| v14.x   | ✔️ **Full working support**              |
| v16.x   | ✔️ **Full working support**              |
| v18.x   | ❌ Some feature may not work (see notes) |
| v20.x   | ✔️ **Full working support**              |
| v22.x   | ✔️ **Full working support**              |

\* Due to changes in OpenSSL in Node v18, some chains helper may not work. If you encounter bugs using Node v18, you might want to consider using the `--openssl-legacy-provider` feature flag while running your project.

### Supported Deno Versions

Since v2, Deno is now [compatible with npm packages](https://docs.deno.com/runtime/fundamentals/node/) and can be used as an alternative to Node.js.

| Version | Supported                                |
| ------- | ---------------------------------------- |
| v2.x    | ✔️ **Full working support**              |

To install any sdk package with Deno, use the following example:

```bash
deno install npm:@aleph-sdk/client
```

### Running code inside the browser

This SDK relies on several non-native browser modules (such as Streams and Buffer). While bundling your application, either using **rollup** (ex: `Vite`) or **webpack** (ex: `create-react-app`) you might have to rely on external polyfills for those features.

You can check the configuration files from the [examples/toolshed](./examples/toolshed/) directory to get started. Please note that we won't provide polyfills as part of this SDK.

## Contribution

Your contributions are always welcome, [here's a guide to get started](./contributing.md).

## License

This software is released under [The MIT License](./LICENSE).
