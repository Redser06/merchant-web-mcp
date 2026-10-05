# Seller Agent Console

Interactive prototype of a **PSP-hosted control plane** for managed seller agents in agentic commerce. Merchants run Pricing, Listing, Restock, and Storefront agents against Amazon without handing them write keys. Agents propose; a Mandate Gate decides eligibility; a human approves; only approved writes reach SP-API. The same agent definitions publish as plugins for Claude, ChatGPT, and Gemini.

**Start here:** [BRIEFING.md](BRIEFING.md) — product thesis, architecture, demo walkthrough, and what is simulated vs real.

**Open the prototype:** [prototype/index.html](prototype/index.html) (no build step). Architecture diagrams: [prototype/architecture.html](prototype/architecture.html).

This app lives in [merchant-web-mcp](https://github.com/Redser06/merchant-web-mcp) under `apps/seller-agent-console/`. Import source: [ORIGIN.md](ORIGIN.md).

```bash
# from apps/seller-agent-console
open prototype/index.html
python3 -m http.server 8931 --directory prototype

# from the merchant-web-mcp repo root
bun run dev:seller
# → http://localhost:8931
```

Demo merchant: **North Harbour Gear** (UK outdoor/marine gear). Branding in the console: **Meridian Pay · Managed Seller Agents**.

State persists in `localStorage` (`nhg-seller-console-v1`). Use **Reset demo** in the sidebar to restore seed data.
