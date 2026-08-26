import React, { useState } from 'react';
import type { 
  Product, 
  ProductVariant, 
  StoreCart, 
  AgentStep 
} from '../types';
import { 
  ShoppingBag, 
  Search, 
  Star, 
  Shield, 
  Truck, 
  Check, 
  AlertCircle, 
  X, 
  Sparkles, 
  ExternalLink,
  Flame
} from 'lucide-react';

interface StorefrontProps {
  products: Product[];
  cart: StoreCart;
  activeStep?: AgentStep;
  onAddToCart: (variantId: string, quantity: number) => void;
  onRemoveFromCart: (variantId: string) => void;
  onApplyPromo: (code: string) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

export const Storefront: React.FC<StorefrontProps> = ({
  products,
  cart,
  activeStep,
  onAddToCart,
  onRemoveFromCart,
  onApplyPromo,
  isCartOpen,
  setIsCartOpen
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [promoInput, setPromoInput] = useState<string>('');

  const categories = ['All', 'Footwear', 'Apparel', 'Gear', 'Packs'];

  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  const isHighlighted = (productId: string, variantId?: string) => {
    if (!activeStep || !activeStep.highlightTarget) return false;
    if (activeStep.highlightTarget.type === 'product' && activeStep.highlightTarget.id === productId) return true;
    if (activeStep.highlightTarget.type === 'variant' && activeStep.highlightTarget.id === variantId) return true;
    return false;
  };

  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariant(product.variants[0] || null);
  };

  const handleApplyPromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    onApplyPromo(promoInput.trim());
    setPromoInput('');
  };

  return (
    <div className="bg-slate-950 text-slate-100 flex flex-col h-full overflow-hidden border-r border-slate-800 relative">
      
      {/* Merchant Store Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-3.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow">
            ▲
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm tracking-tight">Apex Gear Co.</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                Storefront DOM
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Technical Mountain Apparel & Ultralight Gear</p>
          </div>
        </div>

        {/* Cart Trigger */}
        <button
          onClick={() => setIsCartOpen(!isCartOpen)}
          className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeStep?.highlightTarget?.type === 'cart'
              ? 'agent-highlight bg-cyan-600 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-emerald-400" />
          <span>Cart</span>
          <span className="bg-emerald-500 text-slate-950 font-mono text-[11px] font-bold px-1.5 py-0.2 rounded-full">
            {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
          {cart.total > 0 && (
            <span className="text-emerald-400 font-mono text-[11px] font-bold hidden sm:inline">
              ${cart.total.toFixed(2)}
            </span>
          )}
        </button>
      </div>

      {/* Store Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] text-slate-300 shrink-0">
        <div className="flex items-center gap-2">
          <Truck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Free Express Shipping on orders over <strong className="text-emerald-400">$99</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Lifetime Warranty</span>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="p-3 bg-slate-900/50 border-b border-slate-800 flex flex-col sm:flex-row gap-2.5 items-center justify-between shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-slate-100 text-slate-950'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-48">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* Product Grid (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map(product => {
            const highlighted = isHighlighted(product.id);
            const totalStock = product.variants.reduce((acc, v) => acc + (v.inventory - v.reserved), 0);
            const lowStock = totalStock <= 3 && totalStock > 0;
            const isOutOfStock = totalStock === 0;

            return (
              <div
                key={product.id}
                onClick={() => handleOpenProduct(product)}
                className={`group bg-slate-900/70 border rounded-xl overflow-hidden hover:border-slate-700 transition cursor-pointer flex flex-col relative ${
                  highlighted 
                    ? 'agent-highlight border-cyan-400 ring-2 ring-cyan-500/40 bg-slate-900' 
                    : 'border-slate-800'
                }`}
              >
                {/* Agent Activity Badge on Card */}
                {highlighted && (
                  <div className="absolute top-2 left-2 z-10 bg-cyan-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                    <Sparkles className="w-3 h-3 animate-spin" />
                    <span>Agent Query Target</span>
                  </div>
                )}

                {/* Product Image */}
                <div className="h-40 bg-slate-950 relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-[11px] font-mono text-emerald-400 font-bold border border-slate-800">
                    ${product.price.toFixed(2)}
                  </div>
                  {product.attributes.waterproof && (
                    <div className="absolute top-2 right-2 bg-indigo-950/90 text-indigo-300 border border-indigo-500/40 text-[10px] px-1.5 py-0.5 rounded font-medium">
                      Waterproof
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-3.5 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>{product.brand}</span>
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{product.rating}</span>
                        <span className="text-slate-500">({product.reviewCount})</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-slate-100 text-sm line-clamp-1 mb-1">
                      {product.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                      {product.description}
                    </p>
                  </div>

                  {/* Stock & Variants footer */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {isOutOfStock ? (
                        <span className="text-rose-400 font-mono text-[11px] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Out of stock
                        </span>
                      ) : lowStock ? (
                        <span className="text-amber-400 font-mono text-[11px] flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-400 animate-pulse" /> Only {totalStock} left
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                          <Check className="w-3 h-3" /> In stock ({totalStock} units)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-cyan-400 group-hover:underline">
                      {product.variants.length} Options →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">{selectedProduct.category}</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">{selectedProduct.brand}</span>
            </div>

            <h2 className="text-lg font-bold text-slate-100 mb-1">{selectedProduct.title}</h2>
            <div className="flex items-center gap-3 text-xs mb-3">
              <span className="text-lg font-bold font-mono text-emerald-400">${selectedProduct.price.toFixed(2)}</span>
              {selectedProduct.originalPrice && (
                <span className="text-slate-500 line-through font-mono">${selectedProduct.originalPrice.toFixed(2)}</span>
              )}
              <div className="flex items-center gap-1 text-amber-400 ml-auto">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{selectedProduct.rating}</span>
                <span className="text-slate-500">({selectedProduct.reviewCount} reviews)</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">{selectedProduct.description}</p>

            {/* Variants Picker */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-2">Select Variant (Size / Option):</label>
              <div className="grid grid-cols-2 gap-2">
                {selectedProduct.variants.map(v => {
                  const available = v.inventory - v.reserved;
                  const isSelected = selectedVariant?.id === v.id;
                  const isVarHighlighted = activeStep?.highlightTarget?.id === v.id;

                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      disabled={available <= 0}
                      className={`p-2 rounded-lg text-left border text-xs transition ${
                        isVarHighlighted ? 'agent-highlight border-cyan-400' : ''
                      } ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-950/30 text-slate-100' 
                          : available <= 0
                            ? 'border-slate-800 bg-slate-950/40 text-slate-600 opacity-60 cursor-not-allowed'
                            : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-slate-200">{v.name}</div>
                      <div className="flex items-center justify-between text-[10px] font-mono mt-1">
                        <span className="text-slate-400">SKU: {v.sku}</span>
                        <span className={available > 0 ? 'text-emerald-400' : 'text-rose-500'}>
                          {available > 0 ? `${available} left` : 'Out of stock'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Technical Specs Attributes */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs mb-4">
              <span className="font-semibold text-slate-300 block mb-1.5">Technical Specifications:</span>
              <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px]">
                <div>Waterproof: <strong className="text-slate-200">{selectedProduct.attributes.waterproof ? 'Yes (GORE-TEX)' : 'No'}</strong></div>
                {selectedProduct.attributes.weightGrams && (
                  <div>Weight: <strong className="text-slate-200">{selectedProduct.attributes.weightGrams}g</strong></div>
                )}
                {selectedProduct.attributes.material && (
                  <div className="col-span-2">Material: <strong className="text-slate-200">{selectedProduct.attributes.material}</strong></div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                disabled={!selectedVariant || (selectedVariant.inventory - selectedVariant.reserved) <= 0}
                onClick={() => {
                  if (selectedVariant) {
                    onAddToCart(selectedVariant.id, 1);
                    setSelectedProduct(null);
                  }
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold py-2 px-4 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart ({selectedVariant ? `$${selectedVariant.price.toFixed(2)}` : ''})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Slide-Over Drawer */}
      {isCartOpen && (
        <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-sm h-full flex flex-col p-4 shadow-2xl">
            
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-100 text-sm">Active Cart Session</span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {cart.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                  <ShoppingBag className="w-8 h-8 mb-2 stroke-[1.5] text-slate-600" />
                  <p>Your cart session is currently empty.</p>
                </div>
              ) : (
                cart.items.map(item => (
                  <div key={item.variantId} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex gap-3 text-xs">
                    <img src={item.image} alt={item.productTitle} className="w-12 h-12 object-cover rounded bg-slate-900 shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-slate-200 line-clamp-1">{item.productTitle}</div>
                      <div className="text-[11px] text-slate-400">{item.variantName}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono text-emerald-400 font-semibold">${item.price.toFixed(2)} × {item.quantity}</span>
                        <button
                          onClick={() => onRemoveFromCart(item.variantId)}
                          className="text-slate-500 hover:text-rose-400 text-[11px]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Summary & Coupon Form */}
            {cart.items.length > 0 && (
              <div className="border-t border-slate-800 pt-3 space-y-3 shrink-0">
                {/* Promo Code Input */}
                <form onSubmit={handleApplyPromoSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Promo Code (e.g. SUMMER20)"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 font-mono uppercase focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1 rounded border border-slate-700"
                  >
                    Apply
                  </button>
                </form>

                {/* Subtotals */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span>${cart.subtotal.toFixed(2)}</span>
                  </div>
                  {cart.discount > 0 && (
                    <div className="flex justify-between text-cyan-400">
                      <span>Discount ({cart.appliedPromo}):</span>
                      <span>-${cart.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Shipping:</span>
                    <span>{cart.shipping === 0 ? <strong className="text-emerald-400">FREE</strong> : `$${cart.shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-slate-100 font-bold pt-1 border-t border-slate-800 text-sm">
                    <span>Total:</span>
                    <span className="text-emerald-400">${cart.total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Checkout Deep-Link Redirect: https://apexgear.demo/checkout?session=${cart.id}&total=${cart.total.toFixed(2)}`)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg text-xs transition shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
