# aleph-sdk-ts

## Description

This SDK offers binding to interact with the [Aleph decentralized network](https://aleph.im/).

Written in Typescript it is meant as a drop in replacement for the [aleph-js library](https://github.com/aleph-im/aleph-js). It works both in the browser, on a server using Node.js, or an Aleph Virtual Machine without internet access (using [socat](https://manpages.org/socat)).

## Quick Start

```shell
npm install aleph-sdk-ts
```

-   An API reference [on the repository github pages](https://aleph-im.github.io/aleph-sdk-ts/index.html)
-   For guides and use-cases check the [Aleph TS SDK Gitbook](https://aleph-im.gitbook.io/ts-sdk/)
-   Some examples are available in the `/examples` directory.

## Supported chains

This is the list of currently supported Account types. For each of them you can:

-   Retrieve an account from a private key or mnemonic (or generate one on the fly).
-   Sign and send messages on the Aleph Network

On top of that some accounts allow you to **encrypt** messages, retrieve an account from a **browser based** wallet (ex: Metamask), or from a **Ledger** wallet.

| Chain     | Encryption         | Wallet             | Ledger             |
| --------- | ------------------ | ------------------ | ------------------ |
| Avalanche | :heavy_check_mark: | :heavy_check_mark: | :x:                |
| Cosmos    | :x:                | :x:                | :x:                |
| Ethereum  | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| NULS2     | :heavy_check_mark: | :x:                | :x:                |
| Solana    | :x:                | :heavy_check_mark: | :x:                |
| Substrate | :heavy_check_mark: | :x:                | :x:                |
| Tezos     | :x:                | :heavy_check_mark: | :x:                |

## Running from source

If you wish to use feature which are not (yet) released, feel free to clone this repository on your local machine.

Make sure to install the dependencies first by running:

```
npm install
```

You can run the test suite, using:

```
npm run test
```

## Environments

### Supported Node.js versions

This SDK is tested and works, with the following Node.js versions:
| Version | Supported |
| -- | -- |
| v14.x | :heavy_check_mark: **Full working support** |
| v16.x | :heavy_check_mark: **Full working support** |
| v18.x (**LTS**) | :heavy_multiplication_x: Some feature may not work (see notes) |

\* Due to changes in OpenSSL in Node v18, some chains helper may not work. If you encounter bugs using Node v18, you might want to consider using the `--openssl-legacy-provider` feature flag while running your project.

### Running code inside the browser

This SDK relies on several non-native browser modules (such as Streams and Buffer). While bundling your application, either using **rollup** (ex: `Vite`) or **webpack** (ex: `create-react-app`) you might have to rely on external polyfills for those features.

You can check the configuration files from the [examples/toolshed](./examples/toolshed/) directory to get started. Please note that we won't provide polyfills as part of this SDK.

## Contribution

Your contributions are always welcome, [here's a guide to get started](./contributing.md).

## License

This software is released under [The MIT License](./LICENSE).
