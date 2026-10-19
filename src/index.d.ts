export interface GasCost {
  native: string;
  /** Present on paid tiers only; the free demo tier omits USDC figures. */
  usdc?: number;
  gasUnits: string;
  label: string;
}

export interface GasChain {
  chain: string;
  chainId: number;
  nativeToken: string;
  tokenPriceUsd?: number;
  gasPrice?: { baseFeeGwei: string; priorityFeeGwei: string; totalFeeGwei: string };
  estimatedCosts?: {
    nativeTransfer: GasCost;
    erc20Transfer: GasCost;
    dexSwap: GasCost;
  };
  blockNumber?: string;
  latencyMs?: number;
  status: "ok" | "error";
  error?: string;
}

export interface GasRecommendation {
  cheapestChain: string;
  cheapestChainId: number;
  action: string;
  estimatedCostsUsdc: Record<string, number>;
  vsExpensive: { chain: string; dexSwapUsdc: number; savingsPercent: string };
}

export interface GasResponse {
  success: boolean;
  tier: "demo" | "basic" | "premium";
  timestamp: string;
  totalLatencyMs: number;
  /** Paid tiers only; `null` on the demo tier. */
  recommendation: GasRecommendation | null;
  tokenPrices?: Record<string, number>;
  chains: GasChain[];
  meta?: Record<string, unknown>;
}

export interface PricesResponse {
  success: boolean;
  currency: "USD";
  prices: Record<string, number>;
  fetchedAt: string;
  ageSec: number;
}

export interface CheapestChainResult {
  chain: string;
  chainId: number;
  nativeToken: string;
  gasPriceGwei?: string;
  dexSwapCostNative: string;
  /** Omitted when the free price feed is unavailable. */
  dexSwapCostUsdc?: number;
  savingsVs: string;
  savingsPercent: string;
}

export interface PaymentRequiredError extends Error {
  status: 402;
  /** Decoded x402 v2 PAYMENT-REQUIRED header (or v1 body). */
  paymentInfo: unknown;
}

export interface PayOpts {
  /** Private key (0x...) or a viem account. */
  account: `0x${string}` | object;
  network?: "base";
  /** Hard cap in micro-USDC. Default 10000n ($0.01). */
  maxPrice?: bigint;
}

export declare function getGasDemo(): Promise<GasResponse>;
export declare function getPrices(): Promise<PricesResponse>;
export declare function getGasBasic(opts?: { paymentHeader?: Record<string, string> }): Promise<GasResponse>;
export declare function getGasPremium(opts?: { paymentHeader?: Record<string, string> }): Promise<GasResponse>;
export declare function getCheapestChain(): Promise<CheapestChainResult>;
/** Pays $0.001 USDC via @chain-ops/agent-sdk (optional peer dependency). */
export declare function getGasBasicWithPayment(opts: PayOpts): Promise<GasResponse>;
/** Pays $0.002 USDC via @chain-ops/agent-sdk (optional peer dependency). */
export declare function getGasPremiumWithPayment(opts: PayOpts): Promise<GasResponse>;
export declare const DEFAULT_MAX_PRICE: bigint;
export declare const BASE_URL: string;
