export interface GasChain {
  chain: string;
  chainId: number;
  nativeToken: string;
  tokenPriceUsd: number;
  gasPrice: { baseFeeGwei: string; priorityFeeGwei: string; totalFeeGwei: string };
  estimatedCosts: {
    nativeTransfer: { native: string; usdc: number; label: string };
    erc20Transfer: { native: string; usdc: number; label: string };
    dexSwap: { native: string; usdc: number; label: string };
  };
  status: string;
}

export interface GasResponse {
  success: boolean;
  tier: string;
  timestamp: string;
  totalLatencyMs: number;
  recommendation: {
    cheapestChain: string;
    cheapestChainId: number;
    action: string;
    estimatedCostsUsdc: Record<string, number>;
    vsExpensive: { chain: string; savingsPercent: string };
  };
  chains: GasChain[];
}

export interface CheapestChainResult {
  chain: string;
  gasPriceGwei: string;
  dexSwapCostUsdc: number;
  savingsVs: string;
  savingsPercent: string;
}

export declare function getGasDemo(): Promise<GasResponse>;
export declare function getGasBasic(opts?: { paymentHeader?: Record<string, string> }): Promise<GasResponse>;
export declare function getGasPremium(opts?: { paymentHeader?: Record<string, string> }): Promise<GasResponse>;
export declare function getCheapestChain(): Promise<CheapestChainResult>;
export declare const BASE_URL: string;
