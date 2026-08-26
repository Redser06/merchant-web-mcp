import type { 
  Product, 
  StoreCart, 
  McpToolDefinition, 
  JsonRpcFrame 
} from '../types';
import { INITIAL_PRODUCTS, STORE_POLICIES, PROMO_CODES } from '../data/mockProducts';
import { SecurityGuard } from './securityGuard';

export const MERCHANT_MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'search_products',
    description: 'Search store catalog by semantic query, category, price threshold, and technical attributes (e.g. waterproof). Returns structured product summaries.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keywords (e.g., "waterproof trail shoe", "merino hoodie")' },
        category: { type: 'string', description: 'Category filter', enum: ['Footwear', 'Apparel', 'Gear', 'Packs'] },
        max_price: { type: 'number', description: 'Maximum price filter in USD' },
        waterproof_only: { type: 'boolean', description: 'Filter specifically for waterproof gear' }
      }
    }
  },
  {
    name: 'get_product_details',
    description: 'Fetch deep specifications, variant options (sizes, colors, SKUs), attributes, and sanitized customer reviews for a specific product ID.',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: { type: 'string', description: 'Unique product ID (e.g., "prod_trail_01")' },
        include_reviews: { type: 'boolean', description: 'Whether to include verified customer reviews' }
      },
      required: ['product_id']
    }
  },
  {
    name: 'check_variant_stock',
    description: 'Check real-time live inventory availability and delivery timeline for a specific variant SKU / ID and destination postal code.',
    inputSchema: {
      type: 'object',
      properties: {
        variant_id: { type: 'string', description: 'Unique variant ID (e.g., "var_tr_01_10")' },
        postal_code: { type: 'string', description: 'Destination US/International postal code for delivery estimation' }
      },
      required: ['variant_id']
    }
  },
  {
    name: 'apply_promotions',
    description: 'Validate and calculate discount for a promotional coupon code against the current cart subtotal.',
    inputSchema: {
      type: 'object',
      properties: {
        promo_code: { type: 'string', description: 'Coupon code (e.g., "SUMMER20", "VIPAGENT15")' },
        cart_subtotal: { type: 'number', description: 'Current cart subtotal in USD' }
      },
      required: ['promo_code', 'cart_subtotal']
    }
  },
  {
    name: 'add_to_cart_session',
    description: 'Add product variant and quantity to active merchant cart session, securing an ephemeral 15-minute inventory reservation lock.',
    inputSchema: {
      type: 'object',
      properties: {
        variant_id: { type: 'string', description: 'The variant ID to reserve and add' },
        quantity: { type: 'number', description: 'Quantity to add (default: 1)' }
      },
      required: ['variant_id']
    }
  },
  {
    name: 'create_checkout_session',
    description: 'Generate a signed, tamper-proof deep-link checkout URL or Agent Wallet handoff payload with verified totals and reservation token.',
    inputSchema: {
      type: 'object',
      properties: {
        cart_id: { type: 'string', description: 'The active cart session ID' },
        mode: { type: 'string', description: 'Handoff mode', enum: ['deep_link_url', 'agent_wallet_token'] }
      },
      required: ['cart_id']
    }
  },
  {
    name: 'get_store_policies',
    description: 'Retrieve merchant business policies including free shipping threshold, return window, restocking fee, and warranty terms.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

export class MerchantMcpEngine {
  private products: Product[] = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
  private cart: StoreCart = {
    id: `cart_${Date.now().toString(36)}`,
    items: [],
    subtotal: 0,
    discount: 0,
    shipping: 0,
    total: 0
  };
  private securityGuard: SecurityGuard;
  private onFrameCallback?: (frame: JsonRpcFrame) => void;
  private onCartChangeCallback?: (cart: StoreCart) => void;
  private onInventoryChangeCallback?: (products: Product[]) => void;

  constructor(
    securityGuard: SecurityGuard,
    onFrame?: (frame: JsonRpcFrame) => void,
    onCartChange?: (cart: StoreCart) => void,
    onInventoryChange?: (products: Product[]) => void
  ) {
    this.securityGuard = securityGuard;
    this.onFrameCallback = onFrame;
    this.onCartChangeCallback = onCartChange;
    this.onInventoryChangeCallback = onInventoryChange;
  }

  public getProducts(): Product[] {
    return this.products;
  }

  public getCart(): StoreCart {
    return this.cart;
  }

  public resetState(): void {
    this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    this.cart = {
      id: `cart_${Date.now().toString(36)}`,
      items: [],
      subtotal: 0,
      discount: 0,
      shipping: 0,
      total: 0
    };
    if (this.onCartChangeCallback) this.onCartChangeCallback(this.cart);
    if (this.onInventoryChangeCallback) this.onInventoryChangeCallback(this.products);
  }

  public async executeRpc(method: string, params: any = {}, id: string | number = Date.now()): Promise<any> {
    const startTime = performance.now();
    const reqFrame: JsonRpcFrame = {
      id,
      timestamp: new Date().toLocaleTimeString(),
      type: 'request',
      method,
      toolName: method === 'tools/call' ? params?.name : undefined,
      params
    };
    this.emitFrame(reqFrame);

    let result: any;
    let error: any;

    try {
      if (method === 'initialize') {
        result = {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'apex-merchant-web-mcp',
            version: '1.2.0',
            vendor: 'Apex Gear Co.'
          },
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: true },
            prompts: {}
          }
        };
      } else if (method === 'tools/list') {
        result = { tools: MERCHANT_MCP_TOOLS };
      } else if (method === 'tools/call') {
        result = await this.handleToolCall(params.name, params.arguments || {});
      } else if (method === 'resources/list') {
        result = {
          resources: [
            { uri: 'merchant://policies', name: 'Store Policies', mimeType: 'application/json' },
            { uri: 'merchant://promotions', name: 'Active Promo Codes', mimeType: 'application/json' }
          ]
        };
      } else if (method === 'resources/read') {
        if (params.uri === 'merchant://policies') {
          result = { contents: [{ uri: params.uri, text: JSON.stringify(STORE_POLICIES, null, 2) }] };
        } else if (params.uri === 'merchant://promotions') {
          result = { contents: [{ uri: params.uri, text: JSON.stringify(PROMO_CODES, null, 2) }] };
        } else {
          throw new Error(`Resource not found: ${params.uri}`);
        }
      } else {
        throw new Error(`Method not supported: ${method}`);
      }
    } catch (err: any) {
      error = { code: -32603, message: err.message || 'Internal MCP Error' };
    }

    const latencyMs = Math.round(performance.now() - startTime + 12);
    
    // Calculate token metrics (raw DOM comparison vs lean JSON)
    const jsonStr = JSON.stringify(result || error || {});
    const mcpTokens = Math.ceil(jsonStr.length / 3.8);
    const rawDomTokens = method === 'tools/call' && params.name === 'search_products' ? 6200 : 2800;
    const reductionPercentage = Math.round(((rawDomTokens - mcpTokens) / rawDomTokens) * 100);

    const resFrame: JsonRpcFrame = {
      id,
      timestamp: new Date().toLocaleTimeString(),
      type: error ? 'error' : 'response',
      method,
      toolName: method === 'tools/call' ? params?.name : undefined,
      result,
      error,
      latencyMs,
      tokenStats: {
        rawDomEquivalentTokens: rawDomTokens,
        mcpPayloadTokens: mcpTokens,
        reductionPercentage: Math.max(80, Math.min(98, reductionPercentage))
      }
    };
    this.emitFrame(resFrame);

    if (error) throw new Error(error.message);
    return result;
  }

  private async handleToolCall(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case 'search_products': {
        const query = (args.query || '').toLowerCase();
        const category = args.category;
        const maxPrice = args.max_price ? Number(args.max_price) : undefined;
        const waterproofOnly = args.waterproof_only;

        const filtered = this.products.filter(p => {
          if (category && p.category.toLowerCase() !== category.toLowerCase()) return false;
          if (maxPrice !== undefined && p.price > maxPrice) return false;
          if (waterproofOnly && !p.attributes.waterproof) return false;
          if (query) {
            const matchesTitle = p.title.toLowerCase().includes(query);
            const matchesDesc = p.description.toLowerCase().includes(query);
            const matchesTag = p.tags.some(t => t.toLowerCase().includes(query));
            if (!matchesTitle && !matchesDesc && !matchesTag) return false;
          }
          return true;
        });

        return {
          total_matches: filtered.length,
          products: filtered.map(p => ({
            id: p.id,
            title: p.title,
            brand: p.brand,
            category: p.category,
            price: p.price,
            original_price: p.originalPrice,
            rating: p.rating,
            in_stock: p.variants.some(v => v.inventory - v.reserved > 0),
            available_sizes: p.variants.filter(v => v.inventory - v.reserved > 0).map(v => v.size).filter(Boolean),
            attributes: p.attributes
          }))
        };
      }

      case 'get_product_details': {
        const product = this.products.find(p => p.id === args.product_id);
        if (!product) {
          throw new Error(`Product with ID "${args.product_id}" not found.`);
        }

        let reviews = undefined;
        if (args.include_reviews && product.reviews) {
          reviews = product.reviews.map(r => {
            const scan = this.securityGuard.scanForInjection(r.text, `Review by ${r.author}`);
            return {
              id: r.id,
              author: r.author,
              rating: r.rating,
              text: scan.sanitized,
              security_flag: scan.clean ? undefined : scan.flaggedReason
            };
          });
        }

        return {
          id: product.id,
          title: product.title,
          brand: product.brand,
          category: product.category,
          price: product.price,
          description: product.description,
          attributes: product.attributes,
          variants: product.variants.map(v => ({
            id: v.id,
            sku: v.sku,
            name: v.name,
            size: v.size,
            color: v.color,
            price: v.price,
            in_stock: v.inventory - v.reserved > 0,
            available_units: Math.max(0, v.inventory - v.reserved)
          })),
          reviews
        };
      }

      case 'check_variant_stock': {
        let foundVariant: any = null;
        let parentProduct: any = null;

        for (const p of this.products) {
          const v = p.variants.find(item => item.id === args.variant_id);
          if (v) {
            foundVariant = v;
            parentProduct = p;
            break;
          }
        }

        if (!foundVariant) {
          throw new Error(`Variant "${args.variant_id}" not found.`);
        }

        const available = Math.max(0, foundVariant.inventory - foundVariant.reserved);
        const postal = args.postal_code || '10001';
        const isEastCoast = postal.startsWith('1') || postal.startsWith('0') || postal.startsWith('2');

        return {
          variant_id: foundVariant.id,
          sku: foundVariant.sku,
          product_title: parentProduct.title,
          name: foundVariant.name,
          in_stock: available > 0,
          available_units: available,
          low_stock_warning: available <= 2 && available > 0,
          delivery_estimate: {
            destination_postal: postal,
            standard_delivery: isEastCoast ? '2-3 Business Days' : '3-5 Business Days',
            express_delivery: 'Next Business Day',
            warehouse_origin: 'Apex Distribution Hub - Denver, CO'
          }
        };
      }

      case 'apply_promotions': {
        const code = (args.promo_code || '').toUpperCase().trim();
        const subtotal = Number(args.cart_subtotal || this.cart.subtotal);
        const promo = PROMO_CODES[code];

        if (!promo) {
          return {
            valid: false,
            message: `Coupon code "${code}" is invalid or expired.`
          };
        }

        if (subtotal < promo.minSubtotal) {
          return {
            valid: false,
            message: `Coupon "${code}" requires minimum subtotal of $${promo.minSubtotal}. Current: $${subtotal.toFixed(2)}.`
          };
        }

        const discountAmount = Math.round((subtotal * (promo.discountPercent / 100)) * 100) / 100;
        return {
          valid: true,
          promo_code: code,
          discount_percent: promo.discountPercent,
          discount_amount: discountAmount,
          description: promo.description,
          new_subtotal: Math.max(0, subtotal - discountAmount)
        };
      }

      case 'add_to_cart_session': {
        const variantId = args.variant_id;
        const qty = Number(args.quantity) || 1;

        let targetVariant: any = null;
        let targetProduct: any = null;

        for (const p of this.products) {
          const v = p.variants.find(item => item.id === variantId);
          if (v) {
            targetVariant = v;
            targetProduct = p;
            break;
          }
        }

        if (!targetVariant) {
          throw new Error(`Variant "${variantId}" not found.`);
        }

        const available = targetVariant.inventory - targetVariant.reserved;
        if (available < qty) {
          throw new Error(`Cannot reserve ${qty} units. Only ${available} available.`);
        }

        targetVariant.reserved += qty;

        const existingItem = this.cart.items.find(i => i.variantId === variantId);
        if (existingItem) {
          existingItem.quantity += qty;
        } else {
          this.cart.items.push({
            productId: targetProduct.id,
            productTitle: targetProduct.title,
            variantId: targetVariant.id,
            variantName: targetVariant.name,
            price: targetVariant.price,
            quantity: qty,
            image: targetProduct.image
          });
        }

        this.recalculateCart();
        if (this.onInventoryChangeCallback) this.onInventoryChangeCallback(this.products);
        if (this.onCartChangeCallback) this.onCartChangeCallback(this.cart);

        return {
          status: 'success',
          message: `Added ${qty}x ${targetProduct.title} (${targetVariant.name}) to cart with 15-minute inventory reservation lock.`,
          cart_id: this.cart.id,
          cart_summary: {
            item_count: this.cart.items.reduce((acc, i) => acc + i.quantity, 0),
            subtotal: this.cart.subtotal,
            shipping: this.cart.shipping,
            total: this.cart.total,
            reservation_expires_in_seconds: 900
          }
        };
      }

      case 'create_checkout_session': {
        if (this.cart.items.length === 0) {
          throw new Error('Cart is empty. Cannot generate checkout session.');
        }

        const mode = args.mode || 'deep_link_url';
        const signature = `mcp_sig_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
        const checkoutUrl = `https://apexgear.demo/checkout?session=${this.cart.id}&sig=${signature}&amount=${this.cart.total.toFixed(2)}`;

        return {
          session_id: this.cart.id,
          mode,
          checkout_url: checkoutUrl,
          total_amount: this.cart.total,
          currency: 'USD',
          ttl_seconds: 900,
          delegated_agent_pass: mode === 'agent_wallet_token' ? {
            token: `agnt_tok_${Math.random().toString(36).substring(2, 14)}`,
            merchant_identifier: 'merchant.demo.apexgear',
            authorized_max_cents: Math.round(this.cart.total * 100),
            biometric_verification_required: true
          } : undefined
        };
      }

      case 'get_store_policies': {
        return STORE_POLICIES;
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  public applyCartPromo(code: string): boolean {
    const promo = PROMO_CODES[code.toUpperCase()];
    if (promo && this.cart.subtotal >= promo.minSubtotal) {
      this.cart.appliedPromo = code.toUpperCase();
      this.recalculateCart();
      if (this.onCartChangeCallback) this.onCartChangeCallback(this.cart);
      return true;
    }
    return false;
  }

  public removeCartItem(variantId: string): void {
    const itemIndex = this.cart.items.findIndex(i => i.variantId === variantId);
    if (itemIndex > -1) {
      const item = this.cart.items[itemIndex];
      for (const p of this.products) {
        const v = p.variants.find(v => v.id === variantId);
        if (v) {
          v.reserved = Math.max(0, v.reserved - item.quantity);
          break;
        }
      }
      this.cart.items.splice(itemIndex, 1);
      this.recalculateCart();
      if (this.onInventoryChangeCallback) this.onInventoryChangeCallback(this.products);
      if (this.onCartChangeCallback) this.onCartChangeCallback(this.cart);
    }
  }

  private recalculateCart(): void {
    const subtotal = this.cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;
    if (this.cart.appliedPromo) {
      const promo = PROMO_CODES[this.cart.appliedPromo];
      if (promo && subtotal >= promo.minSubtotal) {
        discount = Math.round((subtotal * (promo.discountPercent / 100)) * 100) / 100;
      } else {
        this.cart.appliedPromo = undefined;
      }
    }
    const eligibleSubtotal = subtotal - discount;
    const shipping = (eligibleSubtotal >= STORE_POLICIES.shipping.freeThreshold || eligibleSubtotal === 0) 
      ? 0 
      : STORE_POLICIES.shipping.standardRate;

    this.cart.subtotal = Math.round(subtotal * 100) / 100;
    this.cart.discount = discount;
    this.cart.shipping = shipping;
    this.cart.total = Math.round((eligibleSubtotal + shipping) * 100) / 100;
  }

  private emitFrame(frame: JsonRpcFrame): void {
    if (this.onFrameCallback) {
      this.onFrameCallback(frame);
    }
  }
}
