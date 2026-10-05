# Merchant Web MCP — Agent Analytics & Operability Prototype

> **Turn any e-commerce storefront into an observable, measurable, and transactable platform for AI shopping agents.**

This repository holds **two apps** on the same agentic-commerce ground. This document is the merchant cockpit. The seller-side product thesis stays in its own briefing.

| App | Role | Start |
|---|---|---|
| **1. Merchant Web MCP cockpit** | Observable storefront MCP for AI shopping agents (this README) | `bun install` then `bun run dev` |
| **2. Seller Agent Console** | PSP control plane for managed seller agents | [`apps/seller-agent-console/BRIEFING.md`](apps/seller-agent-console/BRIEFING.md) · `bun run dev:seller` |

[![Build & Test](https://github.com/Redser06/merchant-web-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Redser06/merchant-web-mcp/actions/workflows/ci.yml)
[![Protocol Spec](https://img.shields.io/badge/MCP_Protocol-2024--11--05-blue.svg)](https://modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

---

> [!NOTE]
> **Prototype & Simulation Notice:**
> This repository contains an **interactive simulation cockpit and prototype** of the proposed BigCommerce / Merchant Web MCP plugin architecture. The simulation engine runs client-side with simulated latency, genuine Web Crypto HMAC-SHA256 signing, real 15-minute TTL inventory reservation timers, and an executive Agent Intent Analytics dashboard.

---

## 🎯 The Core Problem & Value Proposition

### The Near-Term Reality: Blindness to Agent Traffic
Today, merchants are blind to AI shopping agents (ChatGPT Agent, Claude, Perplexity, Apple Intelligence). When bots scrape product pages:
- Traffic is indistinguishable from dumb web scrapers.
- Visual scraping consumes 6,000–10,000 tokens per page and frequently breaks on React hydration or DOM redesigns.
- Merchants have **zero visibility** into what products agents are searching for, what queries fail, and what commercial demand passes through uncaptured.

### The Solution: BigCommerce Merchant Web MCP
1. **Agent Intent Analytics (Immediate SaaS Value):** Captures incoming agent sessions, tool executions, discovered intent value (£124k+ pipeline), provider breakdown, and catalog demand gaps.
2. **Deterministic MCP Interface:** Exposes structured JSON-RPC tools (`search_products`, `get_product_details`, `check_variant_stock`, `apply_promotions`, `add_to_cart_session`, `create_checkout_session`).
3. **Verified Cryptographic Handoff:** Generates signed checkout URLs using genuine Web Crypto HMAC-SHA256 tokens with 15-minute ephemeral inventory soft-locks.

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                   AI Shopping Agent                    │
│             (Claude / ChatGPT / Perplexity)            │
└───────────────────────────┬────────────────────────────┘
                            │ (1) Discover: /.well-known/mcp.json
                            │ (2) Transport: HTTP / SSE Stream
                            ▼
┌────────────────────────────────────────────────────────┐
│             Merchant Web MCP Plugin Engine             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Layered Security Guard (Unicode Filter & Regex)  │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                             │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │ Standardized MCP Tools:                          │  │
│  │  • search_products(query, max_price, waterproof) │  │
│  │  • check_variant_stock(variant_id, postal_code)  │  │
│  │  • apply_promotions(promo_code, subtotal)        │  │
│  │  • add_to_cart_session(variant_id, qty) [15m TTL]│  │
│  │  • create_checkout_session (WebCrypto HMAC SHA256│  │
│  │  • get_store_policies()                          │  │
│  └────────────────────────┬─────────────────────────┘  │
└───────────────────────────┼────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│ Merchant Catalog / DB │       │ Storefront Cart & DOM │
│ (BigCommerce / D1)    │       │ (Live State Sync)     │
└───────────────────────┘       └───────────────────────┘
```

---

## 🚀 Running each app

### 1. Merchant Web MCP cockpit

```bash
# Install dependencies
bun install

# Test suite
bun test

# Development server (Vite)
bun run dev
```

Live deployments:

- **Interactive Simulation Cockpit:** [https://merchant-web-mcp.web.app](https://merchant-web-mcp.web.app)
- **Standalone projector demo** (single-file HTML in `demos/`): [https://merchant-web-mcp.web.app/demos/merchant-web-mcp-demo-v2.html](https://merchant-web-mcp.web.app/demos/merchant-web-mcp-demo-v2.html)

### 2. Seller Agent Console

PSP-hosted control plane for managed seller agents (Mandate Gate, human approve, SP-API writes). Demo merchant: North Harbour Gear. Branding: Meridian Pay.

Product thesis, architecture, and what is simulated vs real: **[`apps/seller-agent-console/BRIEFING.md`](apps/seller-agent-console/BRIEFING.md)**. App notes: [`apps/seller-agent-console/README.md`](apps/seller-agent-console/README.md).

No build step. The prototype is static HTML/CSS/JS.

```bash
# from the repo root
bun run dev:seller
# → http://localhost:8931  (prototype/index.html)

# or open the file directly
open apps/seller-agent-console/prototype/index.html
```

Architecture diagrams: [`apps/seller-agent-console/prototype/architecture.html`](apps/seller-agent-console/prototype/architecture.html).

Imported from [seller-agent-console](https://github.com/Redser06/seller-agent-console) at `3ff17182f74373d08c2cab1dbd45f40dd5db5b19` (subtree; see [`apps/seller-agent-console/ORIGIN.md`](apps/seller-agent-console/ORIGIN.md)).

---

## 🛡️ Security & Integrity Highlights in this Repo

- **Genuine Web Crypto HMAC-SHA256:** Implemented in [`src/mcp/cryptoAuth.ts`](src/mcp/cryptoAuth.ts) using standard `crypto.subtle`. Signatures are cryptographically verified upon checkout session generation.
- **Active TTL Inventory Expiration:** Implemented in [`src/mcp/merchantMcpEngine.ts`](src/mcp/merchantMcpEngine.ts). Ephemeral reservations expire after 900 seconds (15 mins), automatically returning stock to available inventory and notifying the client wire HUD.
- **Layered Defense-in-Depth:** Implemented in [`src/mcp/securityGuard.ts`](src/mcp/securityGuard.ts). Normalizes Unicode/zero-width obfuscation and scans across customer reviews, search queries, and promo arguments.
- **Multi-Cart Isolation:** Engine maps carts explicitly by `cart_id`, rejecting checkout attempts on invalid or foreign cart sessions.

---

## 🗺️ Roadmap & Production Specification

For the target Cloudflare Worker + BigCommerce edge server specification, see [`ROADMAP.md`](ROADMAP.md).
