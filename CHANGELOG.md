# Changelog

## 1.2.0 — 2026-10-19

### Added
- **stdio MCP server** (`npx chain-ops-mgo` / `mgo-mcp`): the package is now what the MCP Registry entry `io.github.dlrjsdl200-byte/mgo-mcp-server` claims it is. Tools: `get_gas_demo`, `get_cheapest_chain`, `get_gas_basic`, `get_gas_premium`. Auto-pays when `MGO_PRIVATE_KEY` is set (cap `MGO_MAX_PRICE`, default $0.01). Replaces the separate `mgo-mcp-server` repo.
- `getPrices()` for the free `/prices` endpoint.
- TypeScript declarations for `getGasBasicWithPayment` / `getGasPremiumWithPayment` / `getPrices` / `PayOpts` (they were exported but undeclared).
- `test/smoke.js` (offline by default, `LIVE=1` for API checks).

### Fixed
- `getCheapestChain()` returned `dexSwapCostUsdc: undefined` and `savingsPercent: 'N/A'` since the demo tier stopped including USDC figures. It now ranks by swap cost and derives USD from `/prices`.
- Paid helpers decode the x402 **v2** `PAYMENT-REQUIRED` header into `err.paymentInfo` (previously only the v1 body).
- Auto-pay helpers default `maxPrice` to 10000 micro-USDC instead of "no cap".
- `GasResponse` typings: `recommendation` is `null` on demo, USDC fields optional.

### Changed
- Runtime dependency on `@modelcontextprotocol/sdk` (for the MCP binary). `@chain-ops/agent-sdk` / `viem` stay optional peers.
- README no longer claims ERC-8004 identity is "handled automatically".
- Published from GitHub Actions with npm provenance.

## 1.1.2 — 2026-07-15
- Keywords/README refresh, `mcpName` field. No code changes.

## 1.1.1 — 2026-07-15
- MCP Registry metadata. No code changes.

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
