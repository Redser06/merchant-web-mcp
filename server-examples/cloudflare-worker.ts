/**
 * Cloudflare Worker: Merchant Web MCP Server (SSE & HTTP Transport)
 * Runs at the edge with <15ms latency.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

export interface Env {
  STORE_KV: KVNamespace;
  CATALOG_DB: D1Database;
  CHECKOUT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. Discovery Manifest
    if (url.pathname === "/.well-known/mcp.json") {
      return new Response(JSON.stringify({
        mcp_version: "2024-11-05",
        transport: { type: "sse", url: `${url.origin}/.well-known/mcp` },
        capabilities: { tools: true, resources: true }
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 2. Server-Sent Events Endpoint
    if (url.pathname === "/.well-known/mcp" && request.method === "GET") {
      const server = new Server({
        name: "merchant-edge-mcp",
        version: "1.2.0"
      }, {
        capabilities: { tools: {}, resources: {} }
      });

      // Register Tool: Search Products
      server.tool("search_products", {
        query: z.string(),
        category: z.string().optional(),
        max_price: z.number().optional(),
        waterproof_only: z.boolean().optional()
      }, async (args) => {
        // Query D1 SQL Catalog with parameterized queries
        const items = await env.CATALOG_DB.prepare(
          "SELECT id, title, price, in_stock FROM products WHERE price <= ? LIMIT 10"
        ).bind(args.max_price ?? 9999).all();

        return { content: [{ type: "text", text: JSON.stringify(items.results) }] };
      });

      // Register Tool: Add to Cart with 15-minute soft lock
      server.tool("add_to_cart_session", {
        variant_id: z.string(),
        quantity: z.number().default(1)
      }, async (args) => {
        // Ephemeral lock in KV
        await env.STORE_KV.put(`lock:${args.variant_id}:${Date.now()}`, "reserved", { expirationTtl: 900 });
        return { content: [{ type: "text", text: JSON.stringify({ status: "reserved", ttl: 900 }) }] };
      });

      // Create SSE Transport stream
      const { readable, writable } = new TransformStream();
      const transport = new SSEServerTransport("/.well-known/mcp/messages", writable);
      await server.connect(transport);

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    return new Response("Merchant MCP Edge Gateway Active", { status: 200 });
  }
};
