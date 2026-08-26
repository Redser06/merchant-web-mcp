# Merchant Web MCP — Production Architecture Roadmap 🗺️

> This document details the target production architecture for the Merchant Web MCP Plugin, complementing the interactive simulation cockpit in this repository.

---

## Target Edge Gateway Architecture (Cloudflare Worker + BigCommerce GraphQL)

In production, the merchant plugin deploys as an edge service that securely mediates between external AI shopping agents and the merchant's commerce backend.

```
┌──────────────────────────────────────────────────────────┐
│                   AI Shopping Agent                      │
│             (Claude / ChatGPT / Perplexity)              │
└────────────────────────────┬─────────────────────────────┘
                             │
                             │ (1) MCP Streamable HTTP Request
                             │     Authorization: Bearer <agent_token>
                             ▼
┌──────────────────────────────────────────────────────────┐
│             Merchant Web MCP Edge Gateway                │
│                 (Cloudflare Worker)                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 1. Origin & IP Rate Limiting (Cloudflare KV)       │  │
│  │ 2. Layered Injection Defense & Unicode Filter      │  │
│  │ 3. Semantic Egress Cache (KV Edge Cache)           │  │
│  └─────────────────────────┬──────────────────────────┘  │
│                            │                             │
│  ┌─────────────────────────▼──────────────────────────┐  │
│  │ Standardized MCP Tools:                            │  │
│  │  • search_products                                 │  │
│  │  • get_product_details                             │  │
│  │  • check_variant_stock (UK Hub / Regional Stock)   │  │
│  │  • apply_promotions                                │  │
│  │  • add_to_cart_session (15-min KV soft lock)       │  │
│  │  • create_checkout_session (WebCrypto HMAC SHA256) │  │
│  └─────────────────────────┬──────────────────────────┘  │
└────────────────────────────┼─────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│ BigCommerce Storefront / API  │ │ In-Page Browser Agent Hook    │
│ (GraphQL Catalog & Cart)      │ │ (window.__MERCHANT_MCP__)     │
└───────────────────────────────┘ └───────────────────────────────┘
```

---

## Phase Breakdown

### Phase 1: Interactive Cockpit & Verification (Complete in this repo)
- [x] Client-side simulation engine with full MCP tool schema (`search_products`, `get_product_details`, `check_variant_stock`, `apply_promotions`, `add_to_cart_session`, `create_checkout_session`, `get_store_policies`)
- [x] Real Web Crypto HMAC-SHA256 signature generation and verification (`src/mcp/cryptoAuth.ts`)
- [x] Real 15-minute inventory soft-lock countdown and automatic TTL expiration
- [x] Multi-cart mapping and `cart_id` validation
- [x] Merchant Agent Intent Analytics suite (Discovered Intent £, Provider attribution, Demand Gaps)
- [x] Layered security guard with Unicode normalization and multi-field scanning
- [x] 100% passing unit test suite with GitHub Actions CI

### Phase 2: Standalone Edge Gateway (In Progress)
- [ ] Cloudflare Worker with D1 SQL Database & KV-backed TTL soft locks
- [ ] Model Context Protocol Streamable HTTP Transport support
- [ ] Origin-scoped authentication tokens and CORS enforcement

### Phase 3: BigCommerce App Marketplace Package
- [ ] BigCommerce App Bridge integration (`server-examples/shopify-app-bridge.ts` adapter template)
- [ ] Automated webhook synchronization for inventory drops and catalog updates
- [ ] Native BigCommerce Control Panel analytics widget for merchant visibility
