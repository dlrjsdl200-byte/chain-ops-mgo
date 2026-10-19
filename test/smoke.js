// Smoke test: offline shape checks always; live API checks when LIVE=1.
// Keeps the package publishable from CI without touching the network by default.
const assert = require("node:assert");
const mgo = require("../src/index.js");

(async () => {
  // exports
  for (const fn of ["getGasDemo", "getPrices", "getGasBasic", "getGasPremium", "getCheapestChain", "getGasBasicWithPayment", "getGasPremiumWithPayment"]) {
    assert.strictEqual(typeof mgo[fn], "function", fn + " exported");
  }
  assert.strictEqual(mgo.BASE_URL, "https://api.mgo.chain-ops.xyz");
  assert.strictEqual(typeof mgo.DEFAULT_MAX_PRICE, "bigint");

  // the MCP binary must at least load (SDK import + tool table) without starting stdio
  const src = require("node:fs").readFileSync(require.resolve("../bin/mgo-mcp.js"), "utf8");
  for (const t of ["get_gas_demo", "get_cheapest_chain", "get_gas_basic", "get_gas_premium"]) assert.ok(src.includes(`name: "${t}"`), "tool " + t);
  require("@modelcontextprotocol/sdk/server/index.js");
  require("@modelcontextprotocol/sdk/server/stdio.js");

  if (process.env.LIVE === "1") {
    const demo = await mgo.getGasDemo();
    assert.ok(Array.isArray(demo.chains) && demo.chains.length === 4, "demo has 4 chains");
    const prices = await mgo.getPrices();
    assert.ok(prices.prices.ETH > 0, "ETH price");
    const cheap = await mgo.getCheapestChain();
    assert.ok(cheap.chain && cheap.savingsPercent !== "N/A", "cheapest chain computed: " + JSON.stringify(cheap));
    let threw = false;
    try { await mgo.getGasBasic(); } catch (e) { threw = e.status === 402 && e.paymentInfo && Array.isArray(e.paymentInfo.accepts); }
    assert.ok(threw, "basic throws 402 with decoded requirements");
    console.log("live checks ok:", cheap);
  }
  console.log("smoke ok");
})().catch((e) => { console.error(e); process.exit(1); });