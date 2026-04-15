# Changelog

## 1.1.0 — 2026-04-15

### Added
- `getGasBasicWithPayment({ account })` — auto-pay $0.001 USDC and fetch basic gas comparison via [`@chain-ops/agent-sdk`](https://www.npmjs.com/package/@chain-ops/agent-sdk).
- `getGasPremiumWithPayment({ account })` — auto-pay $0.002 USDC and fetch 9-chain premium comparison via the SDK.
- Optional peer dependencies: `@chain-ops/agent-sdk ^0.1.0` and `viem ^2.21.0`. Free endpoints still work with zero dependencies.
- README "Powered by @chain-ops/agent-sdk" section, install matrix, auto-pay options.

### Changed
- Manual paid functions (`getGasBasic`, `getGasPremium`) now hardened against non-JSON 402 bodies (`.catch(() => ({}))`) — no behavior change on the happy path.
- Description updated to reflect SDK integration.

### Unchanged (backward compatible)
- All v1.0.0 function signatures and return shapes are preserved.
- Default install (`npm install chain-ops-mgo`) still has zero runtime dependencies.

## 1.0.0 — 2026-03-25

- Initial release: `getGasDemo`, `getGasBasic`, `getGasPremium`, `getCheapestChain`. CommonJS, zero deps.
