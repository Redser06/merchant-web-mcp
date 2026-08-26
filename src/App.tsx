import React, { useState, useMemo, useCallback } from 'react';
import type { 
  JsonRpcFrame, 
  SecurityEvent, 
  AgentStep 
} from './types';
import { SecurityGuard } from './mcp/securityGuard';
import { MerchantMcpEngine } from './mcp/merchantMcpEngine';
import { Navbar } from './components/Navbar';
import { Storefront } from './components/Storefront';
import { ProtocolInspector } from './components/ProtocolInspector';
import { AgentSimulator } from './components/AgentSimulator';
import { AgentAnalytics } from './components/AgentAnalytics';
import { PluginCodeModal } from './components/PluginCodeModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cockpit' | 'analytics' | 'protocol' | 'store' | 'agent'>('cockpit');
  const [frames, setFrames] = useState<JsonRpcFrame[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [activeStep, setActiveStep] = useState<AgentStep | undefined>(undefined);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [, setTick] = useState<number>(0);

  // Live session delta tracking
  const [liveSessionDelta, setLiveSessionDelta] = useState({
    sessions: 0,
    toolCalls: 0,
    intentVal: 0,
    cartVal: 0
  });

  const triggerUpdate = useCallback(() => {
    setTick(t => t + 1);
  }, []);

  const handleSecurityEvent = useCallback((evt: SecurityEvent) => {
    setSecurityEvents(prev => [evt, ...prev]);
  }, []);

  const handleFrameEvent = useCallback((frame: JsonRpcFrame) => {
    setFrames(prev => [frame, ...prev.slice(0, 49)]); // Keep last 50 frames
    if (frame.type === 'request' && frame.method === 'tools/call') {
      setLiveSessionDelta(prev => ({
        ...prev,
        toolCalls: prev.toolCalls + 1,
        intentVal: frame.params?.name === 'search_products' ? prev.intentVal + 89 : prev.intentVal,
        cartVal: frame.params?.name === 'add_to_cart_session' ? prev.cartVal + 89 : prev.cartVal
      }));
    }
  }, []);

  // Stable single instance of SecurityGuard and MerchantMcpEngine
  const securityGuard = useMemo(() => {
    return new SecurityGuard(handleSecurityEvent);
  }, [handleSecurityEvent]);

  const engine = useMemo(() => {
    return new MerchantMcpEngine(
      securityGuard,
      handleFrameEvent,
      triggerUpdate,
      triggerUpdate
    );
  }, [securityGuard, handleFrameEvent, triggerUpdate]);

  const products = engine.getProducts();
  const cart = engine.getCart();

  const handleAddToCart = useCallback((variantId: string, quantity: number) => {
    engine.executeRpc('tools/call', {
      name: 'add_to_cart_session',
      arguments: { variant_id: variantId, quantity }
    });
    triggerUpdate();
  }, [engine, triggerUpdate]);

  const handleRemoveFromCart = useCallback((variantId: string) => {
    engine.removeCartItem(variantId);
    triggerUpdate();
  }, [engine, triggerUpdate]);

  const handleApplyPromo = useCallback((code: string) => {
    engine.applyCartPromo(code);
    triggerUpdate();
  }, [engine, triggerUpdate]);

  const handleResetState = useCallback(() => {
    engine.resetState();
    securityGuard.clearEvents();
    setFrames([]);
    setSecurityEvents([]);
    setActiveStep(undefined);
    setLiveSessionDelta({ sessions: 0, toolCalls: 0, intentVal: 0, cartVal: 0 });
    triggerUpdate();
  }, [engine, securityGuard, triggerUpdate]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        onResetState={handleResetState}
        cartCount={cart.items.reduce((s, i) => s + i.quantity, 0)}
        onToggleCart={() => setIsCartOpen(!isCartOpen)}
        securityEventCount={securityEvents.length}
      />

      {/* Main Multi-Panel Workspace */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Cockpit Mode: 3 Columns Side-by-Side */}
        {activeTab === 'cockpit' && (
          <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            
            {/* Left Column: Simulated Merchant Storefront (5 cols) */}
            <div className="lg:col-span-5 h-full overflow-hidden flex flex-col">
              <Storefront
                products={products}
                cart={cart}
                activeStep={activeStep}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                onApplyPromo={handleApplyPromo}
                isCartOpen={isCartOpen}
                setIsCartOpen={setIsCartOpen}
              />
            </div>

            {/* Center Column: MCP Protocol HUD & Streaming Frames (3.5 cols) */}
            <div className="lg:col-span-4 h-full overflow-hidden flex flex-col border-r border-slate-800">
              <ProtocolInspector
                frames={frames}
                securityEvents={securityEvents}
                onClearFrames={() => setFrames([])}
              />
            </div>

            {/* Right Column: AI Agent Simulator & Thought Orchestration (3.5 cols) */}
            <div className="lg:col-span-3 h-full overflow-hidden flex flex-col">
              <AgentSimulator
                engine={engine}
                cart={cart}
                onStepChange={setActiveStep}
                onRefreshData={triggerUpdate}
              />
            </div>

          </div>
        )}

        {/* View: Full Agent Analytics Suite */}
        {activeTab === 'analytics' && (
          <div className="w-full h-full overflow-hidden max-w-6xl mx-auto border-x border-slate-800 flex flex-col">
            <AgentAnalytics liveSessionDelta={liveSessionDelta} />
          </div>
        )}

        {/* Single View: Storefront Only */}
        {activeTab === 'store' && (
          <div className="w-full h-full overflow-hidden">
            <Storefront
              products={products}
              cart={cart}
              activeStep={activeStep}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
              onApplyPromo={handleApplyPromo}
              isCartOpen={isCartOpen}
              setIsCartOpen={setIsCartOpen}
            />
          </div>
        )}

        {/* Single View: Protocol HUD Only */}
        {activeTab === 'protocol' && (
          <div className="w-full h-full overflow-hidden max-w-4xl mx-auto border-x border-slate-800">
            <ProtocolInspector
              frames={frames}
              securityEvents={securityEvents}
              onClearFrames={() => setFrames([])}
            />
          </div>
        )}

        {/* Single View: Agent Simulator Only */}
        {activeTab === 'agent' && (
          <div className="w-full h-full overflow-hidden max-w-4xl mx-auto border-x border-slate-800">
            <AgentSimulator
              engine={engine}
              cart={cart}
              onStepChange={setActiveStep}
              onRefreshData={triggerUpdate}
            />
          </div>
        )}

      </main>

      {/* Integration Code Snippets Modal */}
      <PluginCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

    </div>
  );
};

export default App;
