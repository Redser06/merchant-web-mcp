/**
 * Merchant Web MCP Client Runtime (v1.2.0)
 * Model Context Protocol (2024-11-05 Spec)
 * Exposes window.__MERCHANT_MCP__ for browser-based agents & WebExtensions.
 */
(function() {
  'use strict';

  const scriptTag = document.currentScript;
  const storeId = scriptTag?.getAttribute('data-store-id') || 'merchant-default';
  const mcpEndpoint = scriptTag?.getAttribute('data-mcp-endpoint') || '/.well-known/mcp';

  // Inject discovery meta tag for web agents
  if (!document.querySelector('link[rel="model-context-protocol"]')) {
    const link = document.createElement('link');
    link.rel = 'model-context-protocol';
    link.href = mcpEndpoint;
    document.head.appendChild(link);
  }

  window.__MERCHANT_MCP__ = {
    version: '1.2.0',
    storeId: storeId,
    endpoint: mcpEndpoint,
    
    // Tools list
    listTools: function() {
      return [
        { name: 'search_products', description: 'Semantic product search' },
        { name: 'get_product_details', description: 'Fetch variant and specification data' },
        { name: 'check_variant_stock', description: 'Real-time inventory and carrier delivery estimation' },
        { name: 'apply_promotions', description: 'Validate promotional coupon against cart' },
        { name: 'add_to_cart_session', description: 'Add item and acquire 15-minute soft lock' },
        { name: 'create_checkout_session', description: 'Generate pre-filled 1-click checkout URL' },
        { name: 'get_store_policies', description: 'Retrieve shipping, return, and warranty terms' }
      ];
    },

    // In-page agent execution bridge
    callTool: async function(toolName, args) {
      const response = await fetch(mcpEndpoint + '/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: { name: toolName, arguments: args }
        })
      });
      return await response.json();
    }
  };

  console.log('[Merchant-Web-MCP] Initialized for store:', storeId);
})();
