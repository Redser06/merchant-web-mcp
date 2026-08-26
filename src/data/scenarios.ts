import type { Scenario } from '../types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'scenario_uk_backpack',
    name: 'UK Waterproof Backpack (<£100) — Primary Demo',
    badge: 'Executive Demo',
    icon: 'ShoppingBag',
    prompt: 'Find a waterproof backpack under £100 that ships to the UK.',
    description: 'Agent searches catalog, inspects specs, checks Manchester warehouse stock (12 qty), verifies Royal Mail Tracked 24, and adds to cart (£89.00).',
    expectedOutcome: {
      cartTotal: 89.00,
      itemCount: 1,
      summary: 'Summit 40L Waterproof Backpack added to cart for £89.00 with Free Royal Mail Tracked 24 shipping to the UK. 15-minute soft lock active.'
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Search Products with Constraints',
        thought: 'Querying merchant MCP server for waterproof backpacks under £100 with UK shipping compatibility.',
        toolCall: {
          name: 'search_products',
          params: { query: 'waterproof backpack', max_price: 100, category: 'Packs', waterproof_only: true }
        },
        highlightTarget: { type: 'product', id: 'summit_40l' },
        status: 'pending'
      },
      {
        stepNumber: 2,
        title: 'Inspect Product Specifications',
        thought: 'Summit 40L Waterproof Backpack located (£89.00). Fetching detailed construction specs to verify 100% waterproof claim.',
        toolCall: {
          name: 'get_product_details',
          params: { product_id: 'summit_40l', include_reviews: true }
        },
        highlightTarget: { type: 'product', id: 'summit_40l' },
        status: 'pending'
      },
      {
        stepNumber: 3,
        title: 'Check UK Live Inventory',
        thought: 'Checking real-time warehouse stock in Manchester UK distribution center for SKU TRL-SUM-40L-BLK.',
        toolCall: {
          name: 'check_variant_stock',
          params: { variant_id: 'var_summit_black', postal_code: 'M1 1AE' }
        },
        highlightTarget: { type: 'variant', id: 'var_summit_black' },
        status: 'pending'
      },
      {
        stepNumber: 4,
        title: 'Verify UK Shipping Rates & Policies',
        thought: 'Checking shipping rates for £89.00 order to UK destination (verifying free shipping threshold).',
        toolCall: {
          name: 'get_store_policies',
          params: {}
        },
        highlightTarget: { type: 'policy' },
        status: 'pending'
      },
      {
        stepNumber: 5,
        title: 'Add to Cart with Ephemeral Reservation',
        thought: 'Great — Summit 40L is in stock and ships free to the UK. Adding to merchant cart with 15-minute reservation lock.',
        toolCall: {
          name: 'add_to_cart_session',
          params: { variant_id: 'var_summit_black', quantity: 1 }
        },
        highlightTarget: { type: 'cart' },
        status: 'pending'
      },
      {
        stepNumber: 6,
        title: 'Stage 1-Click Checkout Session',
        thought: 'Order ready for review (£89.00 total). Handing off pre-authenticated checkout session to customer for confirmation.',
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
    prompt: 'Check stock for the HydroShield 3L Jacket, apply discount code "SUMMER20", and stage checkout.',
    description: 'Agent selects technical apparel, validates promo code rules (£80 min spend), computes discount, and locks in reservation.',
    expectedOutcome: {
      cartTotal: 132.00,
      itemCount: 1,
      summary: 'Reserved HydroShield Jacket. Applied SUMMER20 (20% off: -£33.00). Final: £132.00 with free UK shipping.'
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Fetch Detailed Product Specifications',
        thought: 'Fetching deep variant metadata for HydroShield 3L Jacket (hydro_shell_03) to locate Medium size variant ID.',
        toolCall: {
          name: 'get_product_details',
          params: { product_id: 'hydro_shell_03' }
        },
        highlightTarget: { type: 'product', id: 'hydro_shell_03' },
        status: 'pending'
      },
      {
        stepNumber: 2,
        title: 'Reserve Medium Size in Cart',
        thought: 'Located variant var_hs_m (5 units in stock). Adding 1 unit to cart session.',
        toolCall: {
          name: 'add_to_cart_session',
          params: { variant_id: 'var_hs_m', quantity: 1 }
        },
        highlightTarget: { type: 'cart' },
        status: 'pending'
      },
      {
        stepNumber: 3,
        title: 'Validate & Apply Promotional Coupon',
        thought: 'Testing promo code "SUMMER20" against cart subtotal of £165.00 via merchant rules engine.',
        toolCall: {
          name: 'apply_promotions',
          params: { promo_code: 'SUMMER20', cart_subtotal: 165.00 }
        },
        highlightTarget: { type: 'promo', id: 'SUMMER20' },
        status: 'pending'
      },
      {
        stepNumber: 4,
        title: 'Finalize Delegated Agent Pass',
        thought: 'Promo code valid! 20% discount applied (-£33.00). Subtotal is £132.00 (qualifies for free shipping). Issuing checkout token.',
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
    prompt: 'Check TrailLite Carbon Trekking Poles in 140cm size; if out of stock, find and reserve the closest in-stock variant.',
    description: 'Agent detects out-of-stock condition deterministically without hallucinating inventory, negotiates 120cm alternative.',
    expectedOutcome: {
      cartTotal: 75.00,
      itemCount: 1,
      summary: '140cm was out of stock. Gracefully fell back and reserved 120cm adjustable Carbon Poles for £75.00.'
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Inspect Trekking Pole Variants',
        thought: 'Retrieving variant catalog for TrailLite Carbon Trekking Poles (carbon_poles_05).',
        toolCall: {
          name: 'get_product_details',
          params: { product_id: 'carbon_poles_05' }
        },
        highlightTarget: { type: 'product', id: 'carbon_poles_05' },
        status: 'pending'
      },
      {
        stepNumber: 2,
        title: 'Check Live Inventory for Requested 140cm',
        thought: 'Querying real-time stock for variant var_cp_140.',
        toolCall: {
          name: 'check_variant_stock',
          params: { variant_id: 'var_cp_140' }
        },
        highlightTarget: { type: 'variant', id: 'var_cp_140' },
        status: 'pending'
      },
      {
        stepNumber: 3,
        title: 'Detect Out-of-Stock & Check 120cm Alternative',
        thought: 'Notice: 140cm variant is OUT OF STOCK (0 units). Fallback rule activated: checking 100-125cm variant (var_cp_120).',
        toolCall: {
          name: 'check_variant_stock',
          params: { variant_id: 'var_cp_120' }
        },
        highlightTarget: { type: 'variant', id: 'var_cp_120' },
        status: 'pending'
      },
      {
        stepNumber: 4,
        title: 'Reserve Alternative Variant in Cart',
        thought: '120cm variant has 5 units in stock. Reserving 1 unit and staging checkout session.',
        toolCall: {
          name: 'add_to_cart_session',
          params: { variant_id: 'var_cp_120', quantity: 1 }
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
    prompt: 'Fetch verified customer reviews for the Summit 40L Backpack to check durability before purchasing.',
    description: 'Demonstrates the plugin Security Guard intercepting and neutralizing a prompt injection attack disguised in customer reviews.',
    expectedOutcome: {
      summary: 'Prompt injection signature detected and neutralized in product review. Clean sanitized data returned to LLM context.'
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Fetch Product Details with Customer Reviews',
        thought: 'Requesting product specs and verified customer reviews for Summit 40L Waterproof Backpack (summit_40l).',
        toolCall: {
          name: 'get_product_details',
          params: { product_id: 'summit_40l', include_reviews: true }
        },
        highlightTarget: { type: 'product', id: 'summit_40l' },
        status: 'pending',
        securityAnnotation: {
          flagged: true,
          reason: 'Review 2 contained malicious [SYSTEM OVERRIDE: ...] injection payload.',
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
