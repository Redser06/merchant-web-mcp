import React, { useState } from 'react';
import { X, Copy, Check, Code2, Globe, Shield, Cpu, Terminal } from 'lucide-react';

interface PluginCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PluginCodeModal: React.FC<PluginCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'script' | 'worker' | 'manifest' | 'schema'>('script');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const scriptCode = `<!-- 1. Drop this single script tag into your store's <head> or theme.liquid (Shopify) -->
<script 
  src="https://cdn.merchantmcp.dev/v1/merchant-mcp.min.js" 
  data-store-id="apex-gear-01"
  data-mcp-endpoint="https://api.apexgear.com/.well-known/mcp"
  data-rate-limit="60"
  data-enable-guard="true"
  async>
</script>

<!-- 
This automatically:
1. Registers window.__MERCHANT_MCP__ client hooks for in-browser agents.
2. Emits <link rel="model-context-protocol" href="/.well-known/mcp"> discovery header.
3. Synchronizes agent cart reservations with your native cart session.
-->`;

  const workerCode = `// Cloudflare Worker / Vercel Edge Server: /.well-known/mcp SSE Endpoint
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // MCP SSE Handshake
    if (url.pathname === "/.well-known/mcp" && request.method === "GET") {
      const server = new Server({
        name: "apex-merchant-mcp",
        version: "1.0.0"
      }, {
        capabilities: {
          tools: {},
          resources: {}
        }
      });

      // Register Tool: Search Products
      server.tool("search_products", {
        query: z.string(),
        category: z.string().optional(),
        max_price: z.number().optional()
      }, async (args) => {
        const results = await env.CATALOG_DB.search(args);
        return { content: [{ type: "text", text: JSON.stringify(results) }] };
      });

      // Register Tool: Create Signed Checkout
      server.tool("create_checkout_session", {
        cart_id: z.string()
      }, async ({ cart_id }) => {
        const session = await env.CHECKOUT.createSignedSession(cart_id);
        return { content: [{ type: "text", text: JSON.stringify(session) }] };
      });

      const transport = new SSEServerTransport("/.well-known/mcp/messages", responseStream);
      await server.connect(transport);
      return transport.response;
    }

    return new Response("Not found", { status: 404 });
  }
};`;

  const manifestCode = `{
  "$schema": "https://modelcontextprotocol.io/schemas/v1/manifest.json",
  "mcp_version": "2024-11-05",
  "server": {
    "name": "Apex Gear Co. Merchant MCP",
    "description": "Deterministic product catalog, inventory reservation, and checkout handoff for AI shopping agents.",
    "homepage": "https://apexgear.demo",
    "transport": {
      "type": "sse",
      "url": "https://apexgear.demo/.well-known/mcp"
    }
  },
  "capabilities": {
    "tools": [
      "search_products",
      "get_product_details",
      "check_variant_stock",
      "apply_promotions",
      "add_to_cart_session",
      "create_checkout_session",
      "get_store_policies"
    ],
    "resources": [
      "merchant://policies",
      "merchant://promotions"
    ]
  },
  "security": {
    "prompt_injection_guard": true,
    "inventory_soft_lock_ttl_seconds": 900,
    "rate_limit_rpm": 120
  }
}`;

  const schemaCode = `// Standard Merchant MCP Tool Signatures (JSON Schema)
{
  "tools": [
    {
      "name": "search_products",
      "description": "Multi-attribute catalog search with deterministic stock validation",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": { "type": "string" },
          "category": { "type": "string", "enum": ["Footwear", "Apparel", "Gear", "Packs"] },
          "max_price": { "type": "number" },
          "waterproof_only": { "type": "boolean" }
        }
      }
    },
    {
      "name": "check_variant_stock",
      "description": "Live real-time inventory count with carrier delivery estimate",
      "inputSchema": {
        "type": "object",
        "properties": {
          "variant_id": { "type": "string" },
          "postal_code": { "type": "string" }
        },
        "required": ["variant_id"]
      }
    },
    {
      "name": "create_checkout_session",
      "description": "Generates signed deep-link or Agent Wallet token for 1-click conversion",
      "inputSchema": {
        "type": "object",
        "properties": {
          "cart_id": { "type": "string" },
          "mode": { "type": "string", "enum": ["deep_link_url", "agent_wallet_token"] }
        },
        "required": ["cart_id"]
      }
    }
  ]
}`;

  const getActiveCode = () => {
    switch (activeTab) {
      case 'script': return scriptCode;
      case 'worker': return workerCode;
      case 'manifest': return manifestCode;
      case 'schema': return schemaCode;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Merchant Plugin Integration Code</h3>
              <p className="text-xs text-slate-400">Zero-overhead snippets to make any e-commerce site agent-operable</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-3 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('script')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg border-t border-x transition flex items-center gap-1.5 ${
                activeTab === 'script'
                  ? 'bg-slate-900 border-slate-800 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Client &lt;script&gt; Embed</span>
            </button>

            <button
              onClick={() => setActiveTab('worker')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg border-t border-x transition flex items-center gap-1.5 ${
                activeTab === 'worker'
                  ? 'bg-slate-900 border-slate-800 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Cloudflare Edge Worker</span>
            </button>

            <button
              onClick={() => setActiveTab('manifest')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg border-t border-x transition flex items-center gap-1.5 ${
                activeTab === 'manifest'
                  ? 'bg-slate-900 border-slate-800 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>/.well-known/mcp.json</span>
            </button>

            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg border-t border-x transition flex items-center gap-1.5 ${
                activeTab === 'schema'
                  ? 'bg-slate-900 border-slate-800 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Tool Schemas</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 mb-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Snippet'}</span>
          </button>
        </div>

        {/* Code View Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-xs text-slate-300">
          <pre className="overflow-x-auto leading-relaxed">{getActiveCode()}</pre>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Standard: Model Context Protocol (2024-11-05 Specification)</span>
          <span className="text-emerald-400 font-mono">Compatible with Claude, ChatGPT, Gemini & Agentic Runtimes</span>
        </div>

      </div>
    </div>
  );
};
