# @aleph-sdk/substrate
The @aleph-sdk/substrate package is designed to facilitate interactions with Polkadot/Substrate-based accounts on the Aleph.im network. It encompasses functionalities to manage account creation, importation, and to sign messages using the Substrate protocol, thus enabling seamless integrations for applications built on or transacting with Polkadot or other Substrate-based blockchains.

See [@aleph-sdk/client](https://npmjs.com/package/@aleph-sdk/client) or the [offical docs](https://docs.aleph.im) as the entrypoint for developing with aleph.im.

## Features
- Account Management: Generate new Substrate accounts or import existing ones using a mnemonic or private key.
- Message Signing: Sign messages using Substrate keypairs or through connected wallet providers while ensuring integrity and non-repudiation.
- Signature Verification: Verify the authenticity of signatures against the original messages and signer's addresses.
- Provider Integration: Interface with Polkadot.js browser extension providers to fetch account details and perform signing operations.
