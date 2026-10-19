---
name: chain-ops-mgo
description: Compare real-time gas prices across up to 9 EVM chains and get the cheapest chain recommendation. Pay-per-call via x402 on Base. No API key needed. Use when agent needs to optimize EVM transaction costs.
---

# chain-ops MGO — Multi-chain Gas Optimizer

Use this skill when the agent needs to find the cheapest EVM chain for a transaction, compare gas prices across chains, or optimize transaction costs.

## When to use

- "Which chain is cheapest for gas right now?"
- "Compare gas prices across EVM chains"
- "I want to send a transaction — where should I do it?"
- "Find the cheapest chain to deploy a contract"
- "How much will this transaction cost on Base vs Ethereum?"

## Install

```bash
npm install chain-ops-mgo
```

## Usage

```javascript
const { getCheapestChain, getGasDemo } = require('chain-ops-mgo');

// Free — no payment needed
const best = await getCheapestChain();
console.log(`Use ${best.chain} — saves ${best.savingsPercent} vs ${best.savingsVs}`);
// "Use Optimism — saves 97.4% vs Ethereum"
```

## MCP

`npx -y chain-ops-mgo` runs a stdio MCP server with the same tools (set `MGO_PRIVATE_KEY` to let it pay). Remote alternative: `https://api.mgo.chain-ops.xyz/mcp`.

## API Endpoints

Base URL: `https://api.mgo.chain-ops.xyz`

| Endpoint | Price | Chains |
|----------|-------|--------|
| GET /gas/demo | Free | 4 |
| GET /prices | Free | — |
| GET /gas/basic | $0.001 USDC | 4 |
| GET /gas/premium | $0.002 USDC | 9 |

## Payment

x402 protocol on Base (eip155:8453), USDC.
No API key, no subscription.

## Links

- Dashboard: https://mgo.chain-ops.xyz
- API docs: https://api.mgo.chain-ops.xyz/llms.txt
- Source: https://github.com/dlrjsdl200-byte/chain-ops-mgo
