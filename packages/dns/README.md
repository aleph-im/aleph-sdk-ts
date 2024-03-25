# @aleph-sdk/dns

The `@aleph-sdk/dns` module provides a set of utilities for DNS resolution and manipulation, tailored for use within the Aleph.im ecosystem. It offers functionalities to parse hostnames from URLs, perform DNS queries for various record types, and validate domain configurations against specific criteria.

**This package uses `node:dns`, which needs to be polyfilled, if used in a browser environment.**

## Features

- Parse hostnames from URLs, with or without protocols specified.
- Resolve IPv4 and IPv6 addresses.
- Fetch DNSLink records.
- Validate domain configurations for Aleph.im specific targets (e.g., IPFS files, deployed ASGI programs and instances).

## Installation

You can install `@aleph-sdk/dns` using npm:

```bash
npm install @aleph-sdk/dns
```