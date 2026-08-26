/**
 * Shopify App Bridge: Merchant Web MCP Adapter
 * Maps Shopify Storefront GraphQL & Admin APIs to standard MCP tools.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { z } from "zod";

export function createShopifyMcpServer(shopifyClient: any) {
  const server = new Server({
    name: "shopify-storefront-mcp",
    version: "1.2.0"
  }, {
    capabilities: { tools: {}, resources: {} }
  });

  // Map Shopify Storefront Products Query to MCP
  server.tool("search_products", {
    query: z.string(),
    max_price: z.number().optional()
  }, async ({ query, max_price: _max_price }) => {
    const response = await shopifyClient.request(`
      query SearchProducts($query: String!) {
        products(first: 10, query: $query) {
          edges {
            node {
              id
              title
              description
              variants(first: 5) {
                edges {
                  node {
                    id
                    title
                    price { amount currencyCode }
                    availableForSale
                    quantityAvailable
                  }
                }
              }
            }
          }
        }
      }
    `, { variables: { query } });

    return { content: [{ type: "text", text: JSON.stringify(response.data) }] };
  });

  // Map Shopify Cart Creation & Checkout Handoff
  server.tool("create_checkout_session", {
    cart_id: z.string()
  }, async ({ cart_id }) => {
    const response = await shopifyClient.request(`
      query GetCartCheckoutUrl($cartId: ID!) {
        cart(id: $cartId) {
          checkoutUrl
          cost { totalAmount { amount currencyCode } }
        }
      }
    `, { variables: { cartId: cart_id } });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          checkout_url: response.data.cart.checkoutUrl,
          total: response.data.cart.cost.totalAmount
        })
      }]
    };
  });

  return server;
}
