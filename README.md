# chain-ops-mgo

> Multi-chain Gas Optimizer — Compare real-time gas prices across 9 EVM chains. Pay-per-call via [x402](https://x402.org) on Base. No API key needed.

[![npm version](https://img.shields.io/npm/v/chain-ops-mgo.svg)](https://www.npmjs.com/package/chain-ops-mgo)
[![Powered by @chain-ops/agent-sdk](https://img.shields.io/badge/powered%20by-%40chain--ops%2Fagent--sdk-8b5cf6)](https://www.npmjs.com/package/@chain-ops/agent-sdk)
[![ClawHub](https://img.shields.io/badge/ClawHub-chain--ops--mgo-red)](https://clawhub.ai/dlrjsdl200-byte/chain-ops-mgo)

## Install

Free endpoints only:

```bash
npm install chain-ops-mgo
```

Auto-payment (recommended for paid endpoints):

```bash
npm install chain-ops-mgo @chain-ops/agent-sdk viem
```

## Quick Start

### Free — no payment

```javascript
const { getCheapestChain } = require('chain-ops-mgo');

const result = await getCheapestChain();
console.log(result);
// {
//   chain: 'Base',
//   gasPriceGwei: '0.0100',
//   dexSwapCostUsdc: 0.001,
//   savingsVs: 'Ethereum',
//   savingsPercent: '99.8%'
// }
```

### Paid — auto-payment via SDK (recommended)

```javascript
const { getGasBasicWithPayment } = require('chain-ops-mgo');

const data = await getGasBasicWithPayment({
  account: process.env.PRIVATE_KEY, // 0x...
  network: 'base',
});

console.log(data.recommendation.action);
// "Use Base — saves 99.8% vs Ethereum"
```

The SDK handles ERC-8004 identity, EIP-712 signing, and the x402 402-handshake automatically. One USDC microtransaction per call ($0.001 basic, $0.002 premium).

## Endpoints

| Function | Price | Chains | Notes |
|----------|-------|--------|-------|
| `getGasDemo()` | Free | 4 | Raw gas prices, rate limited 10/hr |
| `getCheapestChain()` | Free | 4 | Simple cheapest chain helper |
| `getGasBasicWithPayment({ account })` | $0.001 USDC | 4 | Auto-pay via SDK + recommendation |
| `getGasPremiumWithPayment({ account })` | $0.002 USDC | 9 | Auto-pay via SDK + 9 chains incl. BNB, Polygon, Avalanche, zkSync, Hyperliquid |
| `getGasBasic({ paymentHeader })` | $0.001 USDC | 4 | Manual mode — bring your own x402 header |
| `getGasPremium({ paymentHeader })` | $0.002 USDC | 9 | Manual mode — bring your own x402 header |

## Auto-pay options

```javascript
await getGasPremiumWithPayment({
  account: '0x...',         // private key OR a viem Account object
  network: 'base',          // currently only 'base'
  maxPrice: 5_000n,         // optional cap in micro-USDC ($0.005)
});
```

If `@chain-ops/agent-sdk` is not installed, the auto-pay functions throw a clear error pointing to the install command. Free functions work without it.

## Manual mode (advanced)

If you build your own x402 client, you can supply a pre-built header:

```javascript
const { getGasBasic } = require('chain-ops-mgo');

const data = await getGasBasic({
  paymentHeader: { 'X-PAYMENT': '<your encoded payment>' },
});
```

Without a payment header, paid functions throw `Error: Payment required` with `err.status === 402` and `err.paymentInfo` for inspection.

## Payment

Uses [x402 protocol](https://x402.org) on Base (`eip155:8453`) with USDC. No API key, no subscription, no account required.

## Links

- API: https://api.mgo.chain-ops.xyz
- Dashboard: https://mgo.chain-ops.xyz
- SDK: [`@chain-ops/agent-sdk`](https://www.npmjs.com/package/@chain-ops/agent-sdk) — the underlying x402 + ERC-8004 client
- ClawHub: https://clawhub.ai/dlrjsdl200-byte/chain-ops-mgo
- Homepage: https://chain-ops.xyz

## License

MIT
