# chain-ops-mgo

> Multi-chain Gas Optimizer — Compare real-time gas prices across 9 EVM chains. Pay-per-call via [x402](https://x402.org) on Base. No API key needed.

[![npm version](https://img.shields.io/npm/v/chain-ops-mgo.svg)](https://www.npmjs.com/package/chain-ops-mgo)
[![ClawHub](https://img.shields.io/badge/ClawHub-chain--ops--mgo-red)](https://clawhub.ai/dlrjsdl200-byte/chain-ops-mgo)

## Install

```bash
npm install chain-ops-mgo
```

## Quick Start

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

## Endpoints

| Function | Price | Chains | Description |
|----------|-------|--------|-------------|
| `getGasDemo()` | Free | 4 | Raw gas prices, rate limited 10/hr |
| `getCheapestChain()` | Free | 4 | Simple cheapest chain helper |
| `getGasBasic()` | $0.001 USDC | 4 | + cheapest recommendation + savings % |
| `getGasPremium()` | $0.002 USDC | 9 | Full comparison incl. BNB, Polygon, Avalanche, zkSync, Hyperliquid |

## Usage

### Free (no payment)

```javascript
const { getGasDemo, getCheapestChain } = require('chain-ops-mgo');

// Cheapest chain right now
const best = await getCheapestChain();
console.log(`Use ${best.chain} — saves ${best.savingsPercent} vs ${best.savingsVs}`);

// Raw demo data
const demo = await getGasDemo();
demo.chains.forEach(c => {
  console.log(`${c.chain}: ${c.gasPrice.baseFeeGwei} gwei ($${c.estimatedCosts.dexSwap.usdc} DEX swap)`);
});
```

### Paid via x402

```javascript
const { getGasBasic, getGasPremium } = require('chain-ops-mgo');

// Basic: $0.001 USDC — 4-chain comparison + recommendation
const basic = await getGasBasic();
console.log(basic.recommendation.action);
// "Use Base — saves 99.8% vs Ethereum"

// Premium: $0.002 USDC — 9-chain full comparison
const premium = await getGasPremium();
```

## Payment

Uses [x402 protocol](https://x402.org) on Base (eip155:8453) with USDC.
No API key, no subscription, no account required.

## Links

- API: https://api.mgo.chain-ops.xyz
- Dashboard: https://mgo.chain-ops.xyz
- ClawHub: https://clawhub.ai/dlrjsdl200-byte/chain-ops-mgo
- Homepage: https://chain-ops.xyz
