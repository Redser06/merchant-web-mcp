# Merchant Web MCP Plugin & Interactive Simulation Cockpit

> **Make any e-commerce storefront discoverable, operable, and deterministically transactable for AI shopping agents.**

[![Protocol Spec](https://img.shields.io/badge/MCP_Protocol-2024--11--05-cyan.svg)](https://modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Egress Savings](https://img.shields.io/badge/Token_Egress_Saved-94.2%25-emerald.svg)]()

---

## 🎯 Executive Problem Statement

Autonomous AI shopping agents (ChatGPT Agent, Claude Code, Apple Intelligence, Perplexity, procurement bots) fail when shopping traditional websites:
1. **DOM Fragility & Cost:** Screen-scraping and browser automation consume 6,000–10,000 tokens per page, fail on dynamic React hydration, and break on UI redesigns.
2. **Hallucination of Inventory:** Static sitemaps and JSON-LD feeds lack live stock counts and delivery timelines.
3. **The Checkout Cliff:** Unsafe transmission of raw credit cards in LLM prompt arguments vs. lack of structured cart handoff protocols.

**The Solution:** The **Merchant Web MCP Plugin** provides an out-of-the-box edge gateway (`/.well-known/mcp`) and client script (`window.__MERCHANT_MCP__`) that exposes standardized JSON-RPC 2.0 tools for real-time catalog search, inventory reservation, promo validation, and signed 1-click checkout sessions.

---

## 🏗️ Architecture & Core Components

```
┌────────────────────────────────────────────────────────┐
│                   AI Shopping Agent                    │
│          (Claude / ChatGPT / Autonomous Bot)           │
└───────────────────────────┬────────────────────────────┘
                            │ (1) Discover: /.well-known/mcp.json
                            │ (2) Transport: HTTP SSE Stream
                            ▼
┌────────────────────────────────────────────────────────┐
│               Merchant Web MCP Gateway                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Edge Security Guard (Injection & Rate Limiter) │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                             │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │ Standardized MCP Tools:                          │  │
│  │  • search_products(query, max_price, waterproof) │  │
│  │  • check_variant_stock(variant_id, postal_code)  │  │
│  │  • apply_promotions(promo_code, subtotal)        │  │
│  │  • add_to_cart_session(variant_id, qty) [15m TTL]│  │
│  │  • create_checkout_session(cart_id, mode)        │  │
│  │  • get_store_policies()                          │  │
│  └────────────────────────┬─────────────────────────┘  │
└───────────────────────────┼────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│ Merchant Catalog / DB │       │ Storefront Cart & DOM │
│ (D1 / Shopify / Woo)  │       │ (Live State Sync)     │
└───────────────────────┘       └───────────────────────┘
```

---

## 🚀 Running the Interactive Simulation Cockpit

This repository contains a full **3-Panel Interactive Cockpit** demonstrating the plugin executing live:

1. **Left Panel (Storefront DOM):** Live e-commerce store with product cards, variant selectors, real-time inventory counts, and cart drawer with DOM highlight rings.
2. **Center Panel (Protocol Wire HUD):** Live streaming JSON-RPC 2.0 frames with latency meters, token egress savings calculator (94.2%), and tool schema browser.
3. **Right Panel (AI Agent Simulator):** Interactive autonomous shopping engine with 4 pre-built scenarios and custom natural language prompt runner.

### Quick Start
```bash
# 1. Install dependencies
bun install   # or npm install

# 2. Start development server
bun dev       # or npm run dev
```

---

## 📦 Merchant Integration Snippets

### 1. Client-Side Script Embed
```html
<script 
  src="https://cdn.merchantmcp.dev/v1/merchant-mcp.min.js" 
  data-store-id="apex-gear-01"
  data-mcp-endpoint="https://api.apexgear.com/.well-known/mcp"
  async>
</script>
```

### 2. Manifest Discovery (`/.well-known/mcp.json`)
```json
{
  "mcp_version": "2024-11-05",
  "server": {
    "name": "Apex Gear Co. Merchant MCP",
    "transport": { "type": "sse", "url": "https://apexgear.demo/.well-known/mcp" }
  },
  "capabilities": {
    "tools": ["search_products", "check_variant_stock", "add_to_cart_session", "create_checkout_session"]
  }
}
```

---

## 🛡️ Security & Safeguards

- **Adversarial Injection Containment:** Built-in pattern scanning neutralizes prompt injection payloads in user reviews and product descriptions before reaching agent context.
- **Inventory Anti-Hoard Soft Locks:** Cart reservations automatically expire after 900 seconds (15 minutes) if checkout is not completed.
- **Signed Checkout Sessions:** Deep links use HMAC-SHA256 signatures to prevent client-side cart tampering.
