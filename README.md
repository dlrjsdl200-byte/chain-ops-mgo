# chain-ops-mgo

> Multi-chain Gas Optimizer — Compare real-time gas prices across 9 EVM chains and get the cheapest-chain recommendation. Pay-per-call via [x402](https://x402.org) on Base. No API key, no signup.

**When to use:** call it before any EVM transaction (bridge, deploy, swap) to route to the lowest-fee chain — e.g. *"Use Optimism — saves 97% vs Ethereum"*. Built for AI agents: one USDC microtransaction per call. Ships as a Node client **and** a stdio MCP server.

[![npm version](https://img.shields.io/npm/v/chain-ops-mgo.svg)](https://www.npmjs.com/package/chain-ops-mgo)
[![Powered by @chain-ops/agent-sdk](https://img.shields.io/badge/powered%20by-%40chain--ops%2Fagent--sdk-8b5cf6)](https://www.npmjs.com/package/@chain-ops/agent-sdk)
[![ClawHub](https://img.shields.io/badge/ClawHub-chain--ops--mgo-red)](https://clawhub.ai/dlrjsdl200-byte/skills/chain-ops-mgo)

## MCP server (Claude Desktop, Cursor, any MCP client)

No install needed:

```json
{
  "mcpServers": {
    "mgo-gas": {
      "command": "npx",
      "args": ["-y", "chain-ops-mgo"],
      "env": { "MGO_PRIVATE_KEY": "0x...", "MGO_MAX_PRICE": "10000" }
    }
  }
}
```

Tools: `get_gas_demo`, `get_cheapest_chain` (free), `get_gas_basic` ($0.001), `get_gas_premium` ($0.002).
Without `MGO_PRIVATE_KEY` the paid tools return the x402 payment requirements instead of data. With it (plus `@chain-ops/agent-sdk` and `viem` installed) they pay automatically, capped at `MGO_MAX_PRICE` micro-USDC (default 10000 = $0.01).
Prefer not to run anything? The same tools are hosted at `https://api.mgo.chain-ops.xyz/mcp` (official MCP Registry: `xyz.chain-ops/mgo`).

## Install (library)

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
//   chain: 'Optimism', chainId: 10, nativeToken: 'ETH',
//   gasPriceGwei: '0.0010',
//   dexSwapCostNative: '0.00000016',
//   dexSwapCostUsdc: 0.00039,        // from the free /prices feed; omitted if unavailable
//   savingsVs: 'Ethereum',
//   savingsPercent: '97.4%'
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
// "Use Optimism — saves 97.4% vs Ethereum"
```

The SDK handles the x402 402-handshake (parse requirements, sign the EIP-3009 USDC authorization, retry). One USDC microtransaction per call ($0.001 basic, $0.002 premium), hard-capped at `maxPrice` (default $0.01).

## Endpoints

| Function | Price | Chains | Notes |
|----------|-------|--------|-------|
| `getGasDemo()` | Free | 4 | Raw gas prices (native units), rate limited 10/hr |
| `getPrices()` | Free | — | Native token USD prices (ETH, BNB, POL, AVAX, HYPE), 60s cache |
| `getCheapestChain()` | Free | 4 | Cheapest chain for a DEX swap, USD via `getPrices()` |
| `getGasBasicWithPayment({ account })` | $0.001 USDC | 4 | Auto-pay via SDK + recommendation |
| `getGasPremiumWithPayment({ account })` | $0.002 USDC | 9 | Auto-pay via SDK + 9 chains incl. BNB, Polygon, Avalanche, zkSync, Hyperliquid |
| `getGasBasic({ paymentHeader })` | $0.001 USDC | 4 | Manual mode — bring your own x402 header |
| `getGasPremium({ paymentHeader })` | $0.002 USDC | 9 | Manual mode — bring your own x402 header |

## Auto-pay options

```javascript
await getGasPremiumWithPayment({
  account: '0x...',         // private key OR a viem Account object
  network: 'base',          // currently only 'base'
  maxPrice: 5_000n,         // optional cap in micro-USDC ($0.005); default 10_000n
});
```

If `@chain-ops/agent-sdk` is not installed, the auto-pay functions throw a clear error pointing to the install command. Free functions work without it.

## Manual mode (advanced)

If you build your own x402 client, you can supply a pre-built header:

```javascript
const { getGasBasic } = require('chain-ops-mgo');

const data = await getGasBasic({
  paymentHeader: { 'PAYMENT-SIGNATURE': '<base64 x402 v2 payload>' }, // or 'X-PAYMENT' for v1
});
```

Without a payment header, paid functions throw `Error: Payment required` with `err.status === 402` and `err.paymentInfo` (the decoded `PAYMENT-REQUIRED` header: `accepts[]`, `resource`, ...).

## Payment

Uses [x402 protocol](https://x402.org) on Base (`eip155:8453`) with USDC. No API key, no subscription, no account required.

## Links

- API: https://api.mgo.chain-ops.xyz
- Dashboard: https://mgo.chain-ops.xyz
- SDK: [`@chain-ops/agent-sdk`](https://www.npmjs.com/package/@chain-ops/agent-sdk) — the underlying x402 + ERC-8004 client
- Remote MCP: https://api.mgo.chain-ops.xyz/mcp
- Source: https://github.com/dlrjsdl200-byte/chain-ops-mgo
- Homepage: https://chain-ops.xyz

## License

MIT
