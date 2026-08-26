export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  size?: string;
  color?: string;
  price: number;
  inventory: number;
  reserved: number; // Ephemeral reservation for active agent sessions
}

export interface Product {
  id: string;
  title: string;
  brand: string;
  category: 'Footwear' | 'Apparel' | 'Gear' | 'Packs';
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  description: string;
  image: string;
  tags: string[];
  attributes: {
    waterproof?: boolean;
    weightGrams?: number;
    material?: string;
    temperatureRating?: string;
    capacityLiters?: number;
  };
  variants: ProductVariant[];
  reviews?: {
    id: string;
    author: string;
    rating: number;
    text: string;
    isAdversarial?: boolean;
  }[];
}

export interface CartItem {
  productId: string;
  productTitle: string;
  variantId: string;
  variantName: string;
  price: number;
  quantity: number;
  image: string;
}

export interface StoreCart {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  appliedPromo?: string;
  shipping: number;
  total: number;
  reservationExpiresAt?: number;
}

export type McpMethod = 
  | 'initialize'
  | 'tools/list'
  | 'tools/call'
  | 'resources/list'
  | 'resources/read'
  | 'prompts/list';

export interface McpToolParameter {
  type: string;
  description: string;
  enum?: string[];
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, McpToolParameter>;
    required?: string[];
  };
}

export interface JsonRpcFrame {
  id: string | number;
  timestamp: string;
  type: 'request' | 'response' | 'event' | 'error';
  method?: string;
  toolName?: string;
  params?: Record<string, any>;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  latencyMs?: number;
  tokenStats?: {
    rawDomEquivalentTokens: number;
    mcpPayloadTokens: number;
    reductionPercentage: number;
  };
}

export interface AgentStep {
  stepNumber: number;
  title: string;
  thought: string;
  toolCall?: {
    name: string;
    params: Record<string, any>;
  };
  toolResult?: any;
  highlightTarget?: {
    type: 'product' | 'variant' | 'cart' | 'promo' | 'policy';
    id?: string;
  };
  status: 'pending' | 'running' | 'completed' | 'flagged';
  securityAnnotation?: {
    flagged: boolean;
    reason?: string;
    sanitizedContent?: string;
  };
}

export interface Scenario {
  id: string;
  name: string;
  badge: string;
  icon: string;
  prompt: string;
  description: string;
  steps: AgentStep[];
  expectedOutcome: {
    cartTotal?: number;
    itemCount?: number;
    checkoutUrl?: string;
    summary: string;
  };
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'prompt_injection' | 'inventory_hoard' | 'rate_limit_spike' | 'schema_mismatch';
  description: string;
  rawInput: string;
  actionTaken: 'sanitized' | 'rejected' | 'quarantined';
}
