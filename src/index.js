const BASE_URL = 'https://api.mgo.chain-ops.xyz';

/**
 * Fetch free demo gas prices (4 chains, rate limited 10/hr).
 * @returns {Promise<object>}
 */
async function getGasDemo() {
  const res = await fetch(`${BASE_URL}/gas/demo`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Fetch basic gas comparison (4 chains + cheapest recommendation).
 * Requires x402 payment: $0.001 USDC on Base.
 *
 * Manual mode: pass `opts.paymentHeader` produced by your own x402 client.
 * For automatic payment (recommended), use `getGasBasicWithPayment({ account })`.
 *
 * @param {object} [opts]
 * @param {object} [opts.paymentHeader] - Pre-built x402 header object.
 * @returns {Promise<object>}
 */
async function getGasBasic(opts = {}) {
  return _fetchPaid(`${BASE_URL}/gas/basic`, opts);
}

// Decode the x402 v2 PAYMENT-REQUIRED header (base64 JSON); fall back to the v1 body.
async function _paymentInfo(res) {
  const h = res.headers.get('payment-required');
  if (h) {
    try { return JSON.parse(Buffer.from(h, 'base64').toString('utf8')); } catch {}
  }
  return res.json().catch(() => ({}));
}

async function _fetchPaid(url, opts = {}) {
  const headers = { Accept: 'application/json' };
  if (opts.paymentHeader) Object.assign(headers, opts.paymentHeader);
  const res = await fetch(url, { headers });
  if (res.status === 402) {
    const paymentInfo = await _paymentInfo(res);
    throw Object.assign(new Error('Payment required'), { status: 402, paymentInfo });
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Free native token USD prices (ETH, BNB, POL, AVAX, HYPE), cached 60s server-side.
 * @returns {Promise<{success:boolean,currency:string,prices:Record<string,number>,fetchedAt:string,ageSec:number}>}
 */
async function getPrices() {
  const res = await fetch(`${BASE_URL}/prices`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Fetch premium gas comparison (9 chains).
 * Requires x402 payment: $0.002 USDC on Base.
 *
 * Manual mode: pass `opts.paymentHeader` produced by your own x402 client.
 * For automatic payment (recommended), use `getGasPremiumWithPayment({ account })`.
 *
 * @param {object} [opts]
 * @param {object} [opts.paymentHeader] - Pre-built x402 header object.
 * @returns {Promise<object>}
 */
async function getGasPremium(opts = {}) {
  return _fetchPaid(`${BASE_URL}/gas/premium`, opts);
}

/**
 * Cheapest chain for a DEX swap among the 4 free demo chains (no payment needed).
 * The demo tier returns native-token costs only, so USD is derived from the free
 * /prices endpoint; `dexSwapCostUsdc` is omitted if the price feed is unavailable.
 * @returns {Promise<{chain: string, chainId: number, nativeToken: string, gasPriceGwei: string, dexSwapCostNative: string, dexSwapCostUsdc?: number, savingsVs: string, savingsPercent: string}>}
 */
async function getCheapestChain() {
  const [data, pricesRes] = await Promise.all([getGasDemo(), getPrices().catch(() => null)]);
  const prices = (pricesRes && pricesRes.prices) || {};
  const chains = (data.chains || []).filter((c) => c.status === 'ok' && c.estimatedCosts && c.estimatedCosts.dexSwap);
  if (!chains.length) throw new Error('No chain data');
  // Compare by what a swap actually costs. All demo chains use ETH, so native cost
  // is comparable even when USD prices are missing.
  const costOf = (c) => {
    const native = parseFloat(c.estimatedCosts.dexSwap.native);
    const usd = prices[c.nativeToken];
    return usd > 0 ? native * usd : native;
  };
  const sorted = [...chains].sort((a, b) => costOf(a) - costOf(b));
  const cheap = sorted[0];
  const expensive = sorted[sorted.length - 1];
  const cCost = costOf(cheap), eCost = costOf(expensive);
  const usd = prices[cheap.nativeToken];
  return {
    chain: cheap.chain,
    chainId: cheap.chainId,
    nativeToken: cheap.nativeToken,
    gasPriceGwei: cheap.gasPrice && cheap.gasPrice.baseFeeGwei,
    dexSwapCostNative: cheap.estimatedCosts.dexSwap.native,
    ...(usd > 0 ? { dexSwapCostUsdc: Number((parseFloat(cheap.estimatedCosts.dexSwap.native) * usd).toFixed(6)) } : {}),
    savingsVs: expensive.chain,
    savingsPercent: eCost > 0 ? `${((1 - cCost / eCost) * 100).toFixed(1)}%` : 'N/A'
  };
}

function _loadAgentSdk() {
  try {
    return require('@chain-ops/agent-sdk');
  } catch (e) {
    throw new Error(
      'Auto-payment requires the optional @chain-ops/agent-sdk peer dependency. ' +
      'Install it: npm install @chain-ops/agent-sdk viem'
    );
  }
}

// Default hard cap for auto-pay: 0.01 USDC (10x the premium price).
const DEFAULT_MAX_PRICE = 10000n;

async function _payAndFetch(url, { account, network = 'base', maxPrice } = {}) {
  if (!account) {
    throw new Error('account is required (private key 0x... or viem Account)');
  }
  const { createAgent } = _loadAgentSdk();
  const agent = createAgent({ account, network });
  const result = await agent.pay(url, { maxPrice: maxPrice ?? DEFAULT_MAX_PRICE });
  return result.body;
}

/**
 * Auto-pay $0.001 USDC and fetch basic gas comparison.
 * Powered by @chain-ops/agent-sdk (optional peer dep).
 *
 * @param {object} opts
 * @param {`0x${string}`|object} opts.account - Private key hex string or viem Account.
 * @param {'base'} [opts.network='base'] - x402 network (currently only 'base').
 * @param {bigint} [opts.maxPrice] - Hard cap in micro-USDC. Default 10000n ($0.01).
 * @returns {Promise<object>} The parsed gas response body.
 */
async function getGasBasicWithPayment(opts) {
  return _payAndFetch(`${BASE_URL}/gas/basic`, opts);
}

/**
 * Auto-pay $0.002 USDC and fetch 9-chain premium gas comparison.
 * Powered by @chain-ops/agent-sdk (optional peer dep).
 *
 * @param {object} opts
 * @param {`0x${string}`|object} opts.account - Private key hex string or viem Account.
 * @param {'base'} [opts.network='base'] - x402 network (currently only 'base').
 * @param {bigint} [opts.maxPrice] - Hard cap in micro-USDC. Default 10000n ($0.01).
 * @returns {Promise<object>} The parsed gas response body.
 */
async function getGasPremiumWithPayment(opts) {
  return _payAndFetch(`${BASE_URL}/gas/premium`, opts);
}

module.exports = {
  getGasDemo,
  getPrices,
  getGasBasic,
  getGasPremium,
  getCheapestChain,
  getGasBasicWithPayment,
  getGasPremiumWithPayment,
  DEFAULT_MAX_PRICE,
  BASE_URL
};
