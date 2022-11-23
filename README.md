# aleph-sdk-ts

## Description

This SDK offers binding to interact with the [Aleph decentralized network](https://aleph.im/).

Written in Typescript it is meant as a drop in replacement for the [aleph-js library]().

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

| Chain     | Encryption         | Wallet              | Ledger |
| --------- | ------------------ |---------------------| ------ |
| Avalanche | :heavy_check_mark: | :heavy_check_mark:  | :x:    |
| Cosmos    | :x:                | :x:                 | :x:    |
| Ethereum  | :heavy_check_mark: | :heavy_check_mark:  | :x:    |
| NULS2     | :heavy_check_mark: | :x:                 | :x:    |
| Solana    | :x:                | :heavy_check_mark:  | :x:    |
| Substrate | :heavy_check_mark: | :x:                 | :x:    |
| Tezos     | :x:                | :heavy_check_mark:  | :x:    |

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

## Contribution

Your contributions are always welcome, [here's a guide to get started](./contributing.md).

## License

This software is released under [The MIT License](./LICENSE).
