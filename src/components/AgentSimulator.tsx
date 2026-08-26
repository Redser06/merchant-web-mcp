import React, { useState, useEffect, useRef } from 'react';
import type { 
  Scenario, 
  AgentStep, 
  StoreCart 
} from '../types';
import { SCENARIOS } from '../data/scenarios';
import { MerchantMcpEngine } from '../mcp/merchantMcpEngine';
import { 
  Bot, 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  CreditCard, 
  Send
} from 'lucide-react';

interface AgentSimulatorProps {
  engine: MerchantMcpEngine;
  cart: StoreCart;
  onStepChange: (step?: AgentStep) => void;
  onRefreshData: () => void;
}

export const AgentSimulator: React.FC<AgentSimulatorProps> = ({
  engine,
  onStepChange,
  onRefreshData
}) => {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isExecutingCustom, setIsExecutingCustom] = useState<boolean>(false);
  const [checkoutPayload, setCheckoutPayload] = useState<any>(null);
  
  const timerRef = useRef<number | null>(null);

  // Stop playback when scenario changes
  const handleSelectScenario = (scenario: Scenario) => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setIsPlaying(false);
    setSelectedScenario(scenario);
    setCurrentStepIndex(-1);
    setCheckoutPayload(null);
    engine.resetState();
    onStepChange(undefined);
    onRefreshData();
  };

  const executeStep = async (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= selectedScenario.steps.length) return;

    const step = selectedScenario.steps[stepIndex];
    onStepChange(step);

    try {
      if (step.toolCall) {
        const result = await engine.executeRpc('tools/call', {
          name: step.toolCall.name,
          arguments: step.toolCall.params
        });
        step.toolResult = result;

        if (step.toolCall.name === 'create_checkout_session') {
          setCheckoutPayload(result);
        }
      }
    } catch (err: any) {
      step.toolResult = { error: err.message };
    }

    step.status = 'completed';
    setCurrentStepIndex(stepIndex);
    onRefreshData();

    if (stepIndex === selectedScenario.steps.length - 1) {
      setIsPlaying(false);
    }
  };

  // Next Step Trigger
  const handleNextStep = () => {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx < selectedScenario.steps.length) {
      executeStep(nextIdx);
    }
  };

  // Toggle Auto-play
  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (timerRef.current) window.clearInterval(timerRef.current);
    } else {
      setIsPlaying(true);
      if (currentStepIndex >= selectedScenario.steps.length - 1) {
        handleReset();
        setTimeout(() => {
          setIsPlaying(true);
        }, 100);
      }
    }
  };

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentStepIndex(prev => {
          const next = prev + 1;
          if (next < selectedScenario.steps.length) {
            executeStep(next);
            return next;
          } else {
            setIsPlaying(false);
            if (timerRef.current) window.clearInterval(timerRef.current);
            return prev;
          }
        });
      }, 1800);
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isPlaying, selectedScenario]);

  const handleReset = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setIsPlaying(false);
    setCurrentStepIndex(-1);
    setCheckoutPayload(null);
    engine.resetState();
    onStepChange(undefined);
    onRefreshData();
  };

  // Custom Prompt Execution
  const handleCustomPromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setIsExecutingCustom(true);
    handleReset();

    const q = customPrompt.toLowerCase();
    const isWaterproof = q.includes('waterproof') || q.includes('rain') || q.includes('gore-tex');
    const isHoodie = q.includes('hoodie') || q.includes('wool') || q.includes('merino');
    const isShoe = q.includes('shoe') || q.includes('trail') || q.includes('footwear');

    const dynamicSteps: AgentStep[] = [
      {
        stepNumber: 1,
        title: 'Query Merchant MCP Server',
        thought: `Searching store catalog for keywords matching: "${customPrompt}"`,
        toolCall: {
          name: 'search_products',
          params: { query: customPrompt.substring(0, 30), waterproof_only: isWaterproof }
        },
        status: 'pending'
      }
    ];

    if (isHoodie) {
      dynamicSteps.push({
        stepNumber: 2,
        title: 'Reserve Merino Hoodie Medium',
        thought: 'Selecting Medium variant and adding to cart session.',
        toolCall: { name: 'add_to_cart_session', params: { variant_id: 'var_hd_02_m', quantity: 1 } },
        status: 'pending'
      });
    } else if (isShoe) {
      dynamicSteps.push({
        stepNumber: 2,
        title: 'Check Size 10 Availability',
        thought: 'Checking inventory for Vanguard Trail Pro Size 10.',
        toolCall: { name: 'check_variant_stock', params: { variant_id: 'var_tr_01_10', postal_code: '10001' } },
        status: 'pending'
      }, {
        stepNumber: 3,
        title: 'Add to Cart',
        thought: 'Reserving 1 unit in active cart.',
        toolCall: { name: 'add_to_cart_session', params: { variant_id: 'var_tr_01_10', quantity: 1 } },
        status: 'pending'
      });
    } else {
      dynamicSteps.push({
        stepNumber: 2,
        title: 'Inspect Store Policies & Shipping',
        thought: 'Checking merchant return and shipping policies.',
        toolCall: { name: 'get_store_policies', params: {} },
        status: 'pending'
      });
    }

    dynamicSteps.push({
      stepNumber: dynamicSteps.length + 1,
      title: 'Generate Checkout Session',
      thought: 'Finalizing cart and generating deep link handoff.',
      toolCall: { name: 'create_checkout_session', params: { cart_id: 'active', mode: 'deep_link_url' } },
      status: 'pending'
    });

    const customScenario: Scenario = {
      id: 'custom_user_scenario',
      name: 'Custom User Request',
      badge: 'Interactive NL',
      icon: 'Sparkles',
      prompt: customPrompt,
      description: 'Custom AI agent orchestration generated from user prompt.',
      steps: dynamicSteps,
      expectedOutcome: {
        summary: `Executed ${dynamicSteps.length} MCP tool calls based on your natural language prompt.`
      }
    };

    setSelectedScenario(customScenario);
    setIsExecutingCustom(false);
    setIsPlaying(true);
  };

  const isCompleted = currentStepIndex >= selectedScenario.steps.length - 1 && selectedScenario.steps.length > 0;

  return (
    <div className="bg-slate-950 text-slate-100 flex flex-col h-full overflow-hidden">
      
      {/* Agent Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-3 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm tracking-tight">AI Agent Simulator</span>
              <span className="text-[10px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 font-mono">
                Client Runtime
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Autonomous Shopping Orchestration Engine</p>
          </div>
        </div>

        {/* Step Controller Bar */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={handleTogglePlay}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
              isPlaying 
                ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>{isPlaying ? 'Pause' : isCompleted ? 'Re-run' : 'Auto Run'}</span>
          </button>

          <button
            onClick={handleNextStep}
            disabled={isPlaying || isCompleted}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 px-2 transition"
            title="Execute Next Step"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Next</span>
          </button>

          <button
            onClick={handleReset}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
            title="Reset Scenario State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preset Scenario Selector Carousel */}
      <div className="p-3 bg-slate-900/50 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider font-mono">Select Shopping Scenario:</span>
          <span>{selectedScenario.steps.length} MCP Steps</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SCENARIOS.map(sc => (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(sc)}
              className={`p-2 rounded-lg text-left border text-xs transition flex flex-col justify-between ${
                selectedScenario.id === sc.id
                  ? 'bg-indigo-950/50 border-indigo-500 text-slate-100 ring-1 ring-indigo-500/30'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-slate-200 line-clamp-1 mb-1">{sc.name}</div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded self-start border border-cyan-500/20">
                {sc.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt Input */}
      <div className="p-3 bg-slate-900/30 border-b border-slate-800 shrink-0">
        <form onSubmit={handleCustomPromptSubmit} className="relative">
          <input
            type="text"
            placeholder="Type custom shopping query (e.g. 'Find merino wool hoodie and check shipping')..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-9 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            disabled={!customPrompt.trim() || isExecutingCustom}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-indigo-400 hover:text-indigo-300 disabled:text-slate-600"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* User Intent Prompt Banner */}
      <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-start gap-2.5 shrink-0">
        <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 text-xs">
          <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">User Prompt Intent:</span>
          <p className="text-slate-200 font-medium italic">"{selectedScenario.prompt}"</p>
        </div>
      </div>

      {/* Execution Timeline (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {selectedScenario.steps.map((step, idx) => {
          const isCurrent = currentStepIndex === idx;
          const isDone = currentStepIndex > idx || (isCompleted && currentStepIndex === idx);

          return (
            <div
              key={step.stepNumber}
              className={`rounded-xl border transition-all duration-300 p-3.5 relative ${
                isCurrent 
                  ? 'bg-indigo-950/40 border-indigo-500/80 ring-2 ring-indigo-500/30 shadow-lg' 
                  : isDone
                    ? 'bg-slate-900/60 border-slate-800'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-40'
              }`}
            >
              {/* Step Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                    isDone 
                      ? 'bg-emerald-500 text-slate-950' 
                      : isCurrent 
                        ? 'bg-indigo-500 text-white animate-pulse' 
                        : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.stepNumber}
                  </div>
                  <h4 className="font-semibold text-xs text-slate-200">{step.title}</h4>
                </div>

                {step.toolCall && (
                  <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                    tools/call → {step.toolCall.name}
                  </span>
                )}
              </div>

              {/* Agent Thought Box */}
              <div className="bg-slate-950/90 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300 mb-2 leading-relaxed font-sans">
                <span className="text-[10px] uppercase font-mono text-purple-400 font-bold block mb-0.5 flex items-center gap-1">
                  <Bot className="w-3 h-3" /> Agent Reasoning:
                </span>
                {step.thought}
              </div>

              {/* Security Annotation Alert (if present) */}
              {step.securityAnnotation && (
                <div className="bg-amber-950/40 border border-amber-500/60 rounded-lg p-2 text-xs text-amber-200 mb-2 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[11px] block">Edge Guard Intercepted Injection Payload</span>
                    <span className="text-[10px] text-amber-300/90">{step.securityAnnotation.reason}</span>
                  </div>
                </div>
              )}

              {/* Tool Execution Result Summary */}
              {isDone && step.toolResult && (
                <div className="bg-slate-900 p-2 rounded border border-slate-800 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center justify-between text-[10px] text-emerald-400 mb-1">
                    <span>✓ MCP Tool Result Verified</span>
                    <span>Status: 200 OK</span>
                  </div>
                  <div className="text-slate-300 truncate">
                    {step.toolCall?.name === 'search_products' && `Found ${step.toolResult.total_matches} matching catalog items.`}
                    {step.toolCall?.name === 'check_variant_stock' && `Live Stock: ${step.toolResult.available_units} units available.`}
                    {step.toolCall?.name === 'apply_promotions' && `Discount: -$${step.toolResult.discount_amount} (${step.toolResult.discount_percent}% off).`}
                    {step.toolCall?.name === 'add_to_cart_session' && `Cart Total: $${step.toolResult.cart_summary?.total.toFixed(2)} with 15-min soft lock.`}
                    {step.toolCall?.name === 'create_checkout_session' && `Generated signed session ${step.toolResult.session_id}.`}
                    {step.toolCall?.name === 'get_store_policies' && `Verified 30-day returns & Lifetime Alpine Warranty.`}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Final Conversion / Checkout Handoff Card */}
        {isCompleted && (
          <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/50 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-slate-100 text-sm">Autonomous Assembly Complete</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                Ready for Handoff
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {selectedScenario.expectedOutcome.summary}
            </p>

            {/* Handoff Options Visualizer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
              
              {/* Option A: Instant Deep Link */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-1">
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Signed Deep-Link</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Pre-authenticated 1-click cart URL with 15-min HMAC token.
                  </p>
                </div>
                <button
                  onClick={() => alert(`Redirecting to: ${checkoutPayload?.checkout_url || 'https://apexgear.demo/checkout'}`)}
                  className="mt-2 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1.5 px-2 rounded text-[11px] transition shadow"
                >
                  Open 1-Click Checkout →
                </button>
              </div>

              {/* Option B: Delegated Agent Pass */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Agent Wallet Token</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Delegated payment authorization pass for Apple Pay / Web Payments.
                  </p>
                </div>
                <div className="mt-2 bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono p-1 rounded text-center truncate">
                  AUTH_TOKEN: {checkoutPayload?.delegated_agent_pass?.token || 'agnt_tok_99x81a'}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
