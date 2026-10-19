#!/usr/bin/env node
// MGO MCP server over stdio.
//
//   npx chain-ops-mgo            (or: npx -p chain-ops-mgo mgo-mcp)
//
// Tools: get_gas_demo, get_cheapest_chain (free), get_gas_basic ($0.001),
// get_gas_premium ($0.002). Paid tools return the x402 payment requirements
// unless MGO_PRIVATE_KEY is set and @chain-ops/agent-sdk is installed, in which
// case they pay automatically (USDC on Base, capped by MGO_MAX_PRICE micro-USDC,
// default 10000 = $0.01).
//
// The same tools are also hosted remotely at https://api.mgo.chain-ops.xyz/mcp
// (official MCP Registry: xyz.chain-ops/mgo) if you prefer not to run anything.

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const mgo = require("../src/index.js");
const pkg = require("../package.json");

const TOOLS = [
  {
    name: "get_gas_demo",
    description:
      "Free real-time gas prices for Ethereum, Base, Arbitrum and Optimism (raw gas, no USDC costs). Rate limited 10/hour. Use for a quick look without payment.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_cheapest_chain",
    description:
      "Cheapest EVM chain for a DEX swap right now among the 4 free chains, with the saving vs the most expensive one. Free (rate limited).",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_gas_basic",
    description:
      "4-chain gas comparison (Ethereum, Base, Arbitrum, Optimism) with USDC costs, cheapest-chain recommendation and savings %. x402: $0.001 USDC on Base. Pays automatically when MGO_PRIVATE_KEY is set.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_gas_premium",
    description:
      "9-chain gas comparison (adds BNB Chain, Polygon, Avalanche, zkSync Era, Hyperliquid) with USDC costs and recommendation. x402: $0.002 USDC on Base. Pays automatically when MGO_PRIVATE_KEY is set.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

function formatGasData(data) {
  if (!data || !data.chains) return JSON.stringify(data, null, 2);
  const lines = [];
  if (data.recommendation) {
    const r = data.recommendation;
    lines.push(`CHEAPEST: ${r.cheapestChain}`);
    if (r.estimatedCostsUsdc && r.estimatedCostsUsdc.dexSwap !== undefined) lines.push(`  DEX swap: $${r.estimatedCostsUsdc.dexSwap} USDC`);
    if (r.vsExpensive) lines.push(`  vs ${r.vsExpensive.chain}: saves ${r.vsExpensive.savingsPercent}`);
    if (r.action) lines.push(`  -> ${r.action}`);
    lines.push("");
  }
  lines.push(`GAS PRICES (${String(data.tier || "demo").toUpperCase()}):`);
  const sorted = [...data.chains].sort((a, b) => parseFloat((a.gasPrice && a.gasPrice.baseFeeGwei) || "999") - parseFloat((b.gasPrice && b.gasPrice.baseFeeGwei) || "999"));
  for (const c of sorted) {
    const gwei = (c.gasPrice && c.gasPrice.baseFeeGwei) || "?";
    const cost = c.estimatedCosts && c.estimatedCosts.dexSwap && c.estimatedCosts.dexSwap.usdc;
    lines.push(`  ${String(c.chain).padEnd(14)} ${String(gwei).padStart(10)} gwei` + (cost !== undefined ? `  |  DEX: $${cost}` : "") + (c.status === "error" ? "  (error)" : ""));
  }
  lines.push("");
  lines.push(`Updated: ${data.timestamp} (${data.totalLatencyMs}ms)`);
  return lines.join("\n");
}

const PRIVATE_KEY = process.env.MGO_PRIVATE_KEY;
const MAX_PRICE = (() => { try { return BigInt(process.env.MGO_MAX_PRICE || "10000"); } catch { return 10000n; } })();

async function paidTool(tier) {
  const price = tier === "basic" ? "$0.001" : "$0.002";
  if (PRIVATE_KEY) {
    const fn = tier === "basic" ? mgo.getGasBasicWithPayment : mgo.getGasPremiumWithPayment;
    const body = await fn({ account: PRIVATE_KEY, maxPrice: MAX_PRICE });
    return formatGasData(body);
  }
  try {
    const data = tier === "basic" ? await mgo.getGasBasic() : await mgo.getGasPremium();
    return formatGasData(data);
  } catch (err) {
    if (err && err.status === 402) {
      return JSON.stringify({
        _requires_payment: true,
        price: `${price} USDC`,
        network: "Base (eip155:8453)",
        token: "USDC",
        resource: `${mgo.BASE_URL}/gas/${tier}`,
        how: "Set MGO_PRIVATE_KEY (and install @chain-ops/agent-sdk + viem) to let this server pay automatically, or fetch the resource URL with any x402 client.",
        payment_required: err.paymentInfo,
      }, null, 2);
    }
    throw err;
  }
}

const server = new Server({ name: "mgo-gas-optimizer", version: pkg.version }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  try {
    let text;
    switch (name) {
      case "get_gas_demo": text = formatGasData(await mgo.getGasDemo()); break;
      case "get_cheapest_chain": {
        const r = await mgo.getCheapestChain();
        text = `Cheapest EVM chain: ${r.chain}\n  ${r.gasPriceGwei} gwei  |  DEX swap ${r.dexSwapCostUsdc !== undefined ? "$" + r.dexSwapCostUsdc + " USDC" : r.dexSwapCostNative + " " + r.nativeToken}\n  vs ${r.savingsVs}: saves ${r.savingsPercent}\n\nFor all 9 chains with USDC costs: get_gas_premium ($0.002 USDC)`;
        break;
      }
      case "get_gas_basic": text = await paidTool("basic"); break;
      case "get_gas_premium": text = await paidTool("premium"); break;
      default: return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    }
    return { content: [{ type: "text", text }] };
  } catch (error) {
    return { content: [{ type: "text", text: `Error: ${error && error.message ? error.message : String(error)}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`MGO MCP server ${pkg.version} on stdio (${PRIVATE_KEY ? "auto-pay on, cap " + MAX_PRICE + " micro-USDC" : "read-only; set MGO_PRIVATE_KEY to pay"})`);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
