import React from 'react';
import { 
  Bot, 
  Layers, 
  Zap, 
  Code2, 
  RotateCcw, 
  ShieldCheck, 
  Sparkles,
  Store
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'cockpit' | 'protocol' | 'store' | 'agent';
  setActiveTab: (tab: 'cockpit' | 'protocol' | 'store' | 'agent') => void;
  onOpenCodeModal: () => void;
  onResetState: () => void;
  cartCount: number;
  onToggleCart: () => void;
  securityEventCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCodeModal,
  onResetState,
  cartCount,
  onToggleCart,
  securityEventCount
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & Badge */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-base tracking-tight">Merchant Web MCP</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                v1.2.0 (2024-11-05)
              </span>
            </div>
            <p className="text-xs text-slate-400">Out-of-the-box Agent Protocol Engine for E-Commerce</p>
          </div>
        </div>

        {/* View Switcher (Desktop & Mobile) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('cockpit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'cockpit' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3-Panel Cockpit</span>
          </button>
          
          <button
            onClick={() => setActiveTab('store')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'store' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </button>

          <button
            onClick={() => setActiveTab('protocol')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'protocol' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Protocol HUD</span>
          </button>

          <button
            onClick={() => setActiveTab('agent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'agent' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Agent Sim</span>
          </button>
        </div>

        {/* Live Metrics & Actions */}
        <div className="flex items-center gap-2.5">
          
          {/* Egress Token Savings Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
            <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>94.2% Egress Saved</span>
          </div>

          {/* Security Guard Status */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
            securityEventCount > 0 
              ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}>
            <ShieldCheck className={`w-3 h-3 ${securityEventCount > 0 ? 'text-amber-400' : 'text-cyan-400'}`} />
            <span>Guard: {securityEventCount > 0 ? `${securityEventCount} Filtered` : 'Active'}</span>
          </div>

          {/* Cart trigger in header for quick view */}
          <button
            onClick={onToggleCart}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cart ({cartCount})</span>
          </button>

          {/* Integration Code Modal */}
          <button
            onClick={onOpenCodeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            title="View merchant integration snippet"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Embed Code</span>
          </button>

          {/* Reset Demo State */}
          <button
            onClick={onResetState}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
            title="Reset Catalog & Cart State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
};
