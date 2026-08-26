import type { Scenario } from '../types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'scenario_shoe_search',
    name: 'Multi-Constraint Gear Search & Size Match',
    badge: 'Discovery & Fit',
    icon: 'Compass',
    prompt: 'Find me waterproof trail running shoes under $160 in size 10 US with fast delivery to NYC (10001).',
    description: 'Agent uses structured search, verifies real-time size inventory, checks delivery estimates, and creates a cart reservation.',
    expectedOutcome: {
      cartTotal: 149.99,
      itemCount: 1,
      summary: 'Reserved 1x Vanguard GORE-TEX Trail Pro (Size 10) for $149.99 with free FedEx shipping.'
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Discover Catalog Capabilities & Search',
        thought: 'Querying merchant MCP server with semantic terms and hard constraints (waterproof=true, max_price=160, category=Footwear).',
        toolCall: {
          name: 'search_products',
          params: { query: 'trail running shoe', category: 'Footwear', max_price: 160, waterproof_only: true }
        },
        highlightTarget: { type: 'product', id: 'prod_trail_01' },
        status: 'pending'
      },
      {
        stepNumber: 2,
        title: 'Verify Live Size 10 Stock & Delivery',
        thought: 'Product found: "Vanguard GORE-TEX Trail Pro" ($149.99). Checking live stock count for variant SKU APX-VG-M10 (Size 10) and delivery to 10001.',
        toolCall: {
          name: 'check_variant_stock',
          params: { variant_id: 'var_tr_01_10', postal_code: '10001' }
        },
        highlightTarget: { type: 'variant', id: 'var_tr_01_10' },
        status: 'pending'
      },
      {
        stepNumber: 3,
        title: 'Reserve Inventory & Build Cart',
        thought: 'Stock verified (3 units available). Delivery estimate: 2-3 business days. Placing 15-minute ephemeral inventory reservation lock.',
        toolCall: {
          name: 'add_to_cart_session',
          params: { variant_id: 'var_tr_01_10', quantity: 1 }
        },
        highlightTarget: { type: 'cart' },
        status: 'pending'
      },
      {
        stepNumber: 4,
        title: 'Generate Signed Checkout Session',
        thought: 'Order total is $149.99 (exceeds $99 free shipping threshold). Generating tamper-proof signed checkout handoff URL for user approval.',
        toolCall: {
          name: 'create_checkout_session',
          params: { cart_id: 'active', mode: 'deep_link_url' }
        },
        highlightTarget: { type: 'cart' },
        status: 'pending'
      }
    ]
  },
  {
    id: 'scenario_promo_hoodie',
    name: 'Price Optimization & Coupon Lock',
    badge: 'Discounts & Checkout',
    icon: 'Percent',
    prompt: 'Check stock for the Merino 250 Hoodie in Medium, apply discount code "SUMMER20", and stage checkout.',
    description: 'Agent selects Merino wool apparel, validates promo code rules ($100 min spend), computes discount, and locks in reservation.',
    expectedOutcome: {
      cartTotal: 100.00,
      itemCount: 1,
      summary: 'Reserved Merino 250 Hoodie in Medium. Applied SUMMER20 (20% off: -$25.00). Final: $100.00 with free shipping.'
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Fetch Detailed Product Specifications',
        thought: 'Fetching deep variant metadata for Merino 250 Hoodie (prod_hoodie_02) to locate Medium size variant ID.',
        toolCall: {
          name: 'get_product_details',
          params: { product_id: 'prod_hoodie_02' }
        },
        highlightTarget: { type: 'product', id: 'prod_hoodie_02' },
        status: 'pending'
      },
      {
        stepNumber: 2,
        title: 'Reserve Medium Size in Cart',
        thought: 'Located variant var_hd_02_m (8 units in stock). Adding 1 unit to cart session.',
        toolCall: {
          name: 'add_to_cart_session',
          params: { variant_id: 'var_hd_02_m', quantity: 1 }
        },
        highlightTarget: { type: 'cart' },
        status: 'pending'
      },
      {
        stepNumber: 3,
        title: 'Validate & Apply Promotional Coupon',
        thought: 'Testing promo code "SUMMER20" against cart subtotal of $125.00 via merchant rules engine.',
        toolCall: {
          name: 'apply_promotions',
          params: { promo_code: 'SUMMER20', cart_subtotal: 125.00 }
        },
        highlightTarget: { type: 'promo', id: 'SUMMER20' },
        status: 'pending'
      },
      {
        stepNumber: 4,
        title: 'Finalize Delegated Agent Pass',
        thought: 'Promo code valid! 20% discount applied (-$25.00). Subtotal is $100.00 (qualifies for free shipping). Issuing checkout token.',
        toolCall: {
          name: 'create_checkout_session',
          params: { cart_id: 'active', mode: 'agent_wallet_token' }
        },
        highlightTarget: { type: 'cart' },
        status: 'pending'
      }
    ]
  },
  {
    id: 'scenario_stock_fallback',
    name: 'Out-of-Stock Fallback Negotiation',
    badge: 'Inventory Fallback',
    icon: 'RefreshCw',
    prompt: 'Check Carbon Trekking Poles in 140cm size; if out of stock, find and reserve the closest in-stock variant.',
    description: 'Agent detects out-of-stock condition deterministically without hallucinating inventory, negotiates 120cm alternative.',
    expectedOutcome: {
      cartTotal: 110.00,
      itemCount: 1,
      summary: '140cm was out of stock. Gracefully fell back and reserved 120cm adjustable Carbon Poles for $110.00.'
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Inspect Trekking Pole Variants',
        thought: 'Retrieving variant catalog for Carbon Ultralight Trekking Poles (prod_poles_03).',
        toolCall: {
          name: 'get_product_details',
          params: { product_id: 'prod_poles_03' }
        },
        highlightTarget: { type: 'product', id: 'prod_poles_03' },
        status: 'pending'
      },
      {
        stepNumber: 2,
        title: 'Check Live Inventory for Requested 140cm',
        thought: 'Querying real-time stock for variant var_pl_03_140.',
        toolCall: {
          name: 'check_variant_stock',
          params: { variant_id: 'var_pl_03_140' }
        },
        highlightTarget: { type: 'variant', id: 'var_pl_03_140' },
        status: 'pending'
      },
      {
        stepNumber: 3,
        title: 'Detect Out-of-Stock & Check 120cm Alternative',
        thought: 'Notice: 140cm variant is OUT OF STOCK (0 units). Fallback rule activated: checking 100-125cm variant (var_pl_03_120).',
        toolCall: {
          name: 'check_variant_stock',
          params: { variant_id: 'var_pl_03_120' }
        },
        highlightTarget: { type: 'variant', id: 'var_pl_03_120' },
        status: 'pending'
      },
      {
        stepNumber: 4,
        title: 'Reserve Alternative Variant in Cart',
        thought: '120cm variant has 5 units in stock. Reserving 1 unit and staging checkout session.',
        toolCall: {
          name: 'add_to_cart_session',
          params: { variant_id: 'var_pl_03_120', quantity: 1 }
        },
        highlightTarget: { type: 'cart' },
        status: 'pending'
      }
    ]
  },
  {
    id: 'scenario_adversarial_guard',
    name: 'Adversarial Prompt Injection Defense',
    badge: 'Security & Safety',
    icon: 'ShieldAlert',
    prompt: 'Fetch verified customer reviews for the Vanguard Trail Shoe to check durability before purchasing.',
    description: 'Demonstrates the plugin Security Guard intercepting and neutralizing a prompt injection attack disguised in customer reviews.',
    expectedOutcome: {
      summary: 'Prompt injection signature detected and neutralized in product review. Clean sanitized data returned to LLM context.'
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Fetch Product Details with Customer Reviews',
        thought: 'Requesting product specs and verified customer reviews for Vanguard GORE-TEX Trail Pro (prod_trail_01).',
        toolCall: {
          name: 'get_product_details',
          params: { product_id: 'prod_trail_01', include_reviews: true }
        },
        highlightTarget: { type: 'product', id: 'prod_trail_01' },
        status: 'pending',
        securityAnnotation: {
          flagged: true,
          reason: 'Review 3 contained malicious [SYSTEM OVERRIDE: ...] injection payload.',
          sanitizedContent: '[REDACTED_SECURITY_THREAT] Highly recommend!'
        }
      },
      {
        stepNumber: 2,
        title: 'Inspect Sanitized Response & Proceed Safely',
        thought: 'Security filter intercepted injection attack. Agent context preserved safely without executing unauthorized discount commands.',
        toolCall: {
          name: 'get_store_policies',
          params: {}
        },
        highlightTarget: { type: 'policy' },
        status: 'pending'
      }
    ]
  }
];
