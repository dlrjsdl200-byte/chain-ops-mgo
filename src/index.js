const BASE_URL = 'https://api.mgo.chain-ops.xyz';

/**
 * Fetch free demo gas prices (4 chains, rate limited 10/hr)
 * @returns {Promise<object>}
 */
async function getGasDemo() {
  const res = await fetch(`${BASE_URL}/gas/demo`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Fetch basic gas comparison (4 chains + cheapest recommendation)
 * Requires x402 payment: $0.001 USDC on Base
 * @param {object} [opts]
 * @returns {Promise<object>}
 */
async function getGasBasic(opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (opts.paymentHeader) Object.assign(headers, opts.paymentHeader);
  const res = await fetch(`${BASE_URL}/gas/basic`, { headers });
  if (res.status === 402) {
    const paymentInfo = await res.json();
    throw Object.assign(new Error('Payment required'), { status: 402, paymentInfo });
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Fetch premium gas comparison (9 chains)
 * Requires x402 payment: $0.002 USDC on Base
 * @param {object} [opts]
 * @returns {Promise<object>}
 */
async function getGasPremium(opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (opts.paymentHeader) Object.assign(headers, opts.paymentHeader);
  const res = await fetch(`${BASE_URL}/gas/premium`, { headers });
  if (res.status === 402) {
    const paymentInfo = await res.json();
    throw Object.assign(new Error('Payment required'), { status: 402, paymentInfo });
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Get cheapest chain recommendation from demo data (no payment needed)
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

module.exports = { getGasDemo, getGasBasic, getGasPremium, getCheapestChain, BASE_URL };
