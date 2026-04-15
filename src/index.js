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
  const headers = { 'Content-Type': 'application/json' };
  if (opts.paymentHeader) Object.assign(headers, opts.paymentHeader);
  const res = await fetch(`${BASE_URL}/gas/basic`, { headers });
  if (res.status === 402) {
    const paymentInfo = await res.json().catch(() => ({}));
    throw Object.assign(new Error('Payment required'), { status: 402, paymentInfo });
  }
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
  const headers = { 'Content-Type': 'application/json' };
  if (opts.paymentHeader) Object.assign(headers, opts.paymentHeader);
  const res = await fetch(`${BASE_URL}/gas/premium`, { headers });
  if (res.status === 402) {
    const paymentInfo = await res.json().catch(() => ({}));
    throw Object.assign(new Error('Payment required'), { status: 402, paymentInfo });
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Get cheapest chain recommendation from demo data (no payment needed).
 * @returns {Promise<{chain: string, gasPriceGwei: string, dexSwapCostUsdc: number, savingsVs: string, savingsPercent: string}>}
 */
async function getCheapestChain() {
  const data = await getGasDemo();
  const chains = data.chains || [];
  if (!chains.length) throw new Error('No chain data');
  const sorted = [...chains].sort((a, b) =>
    parseFloat(a.gasPrice?.baseFeeGwei || 999) - parseFloat(b.gasPrice?.baseFeeGwei || 999)
  );
  const cheap = sorted[0];
  const expensive = sorted[sorted.length - 1];
  const cCost = cheap.estimatedCosts?.dexSwap?.usdc;
  const eCost = expensive.estimatedCosts?.dexSwap?.usdc;
  const savings = cCost && eCost && parseFloat(eCost) > 0
    ? `${((1 - cCost / eCost) * 100).toFixed(1)}%`
    : 'N/A';
  return {
    chain: cheap.chain,
    gasPriceGwei: cheap.gasPrice?.baseFeeGwei,
    dexSwapCostUsdc: cCost,
    savingsVs: expensive.chain,
    savingsPercent: savings
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

async function _payAndFetch(url, { account, network = 'base', maxPrice } = {}) {
  if (!account) {
    throw new Error('account is required (private key 0x... or viem Account)');
  }
  const { createAgent } = _loadAgentSdk();
  const agent = createAgent({ account, network });
  const result = await agent.pay(url, maxPrice ? { maxPrice } : undefined);
  return result.body;
}

/**
 * Auto-pay $0.001 USDC and fetch basic gas comparison.
 * Powered by @chain-ops/agent-sdk (optional peer dep).
 *
 * @param {object} opts
 * @param {`0x${string}`|object} opts.account - Private key hex string or viem Account.
 * @param {'base'} [opts.network='base'] - x402 network (currently only 'base').
 * @param {bigint} [opts.maxPrice] - Hard cap in micro-USDC. Defaults to SDK default.
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
 * @param {bigint} [opts.maxPrice] - Hard cap in micro-USDC.
 * @returns {Promise<object>} The parsed gas response body.
 */
async function getGasPremiumWithPayment(opts) {
  return _payAndFetch(`${BASE_URL}/gas/premium`, opts);
}

module.exports = {
  getGasDemo,
  getGasBasic,
  getGasPremium,
  getCheapestChain,
  getGasBasicWithPayment,
  getGasPremiumWithPayment,
  BASE_URL
};
