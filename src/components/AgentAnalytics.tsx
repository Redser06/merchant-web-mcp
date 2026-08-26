import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Zap, 
  ShoppingBag, 
  AlertCircle, 
  Bot, 
  PieChart,
  Search
} from 'lucide-react';

interface AgentAnalyticsProps {
  liveSessionDelta?: {
    sessions: number;
    toolCalls: number;
    intentVal: number;
    cartVal: number;
  };
}

export const AgentAnalytics: React.FC<AgentAnalyticsProps> = ({
  liveSessionDelta = { sessions: 0, toolCalls: 0, intentVal: 0, cartVal: 0 }
}) => {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d'>('today');

  const baseSessions = 1482 + liveSessionDelta.sessions;
  const baseToolCalls = 8924 + liveSessionDelta.toolCalls;
  const baseIntent = 124650 + liveSessionDelta.intentVal;
  const baseCart = 42890 + liveSessionDelta.cartVal;

  const agentProviders = [
    { name: 'Claude 3.7 (Anthropic)', share: 41, sessions: 608, color: '#8b5cf6', badge: 'Primary' },
    { name: 'ChatGPT Agent (OpenAI)', share: 36, sessions: 533, color: '#10b981', badge: 'High-Intent' },
    { name: 'Perplexity Shopping', share: 15, sessions: 222, color: '#3b82f6', badge: 'Discovery' },
    { name: 'Apple Intelligence', share: 8, sessions: 119, color: '#f59e0b', badge: 'Emerging' }
  ];

  const topQueries = [
    { query: 'waterproof backpack under £100 shipping uk', count: 342, intentValue: '£30,438', cartRate: '42%' },
    { query: 'merino wool thermal base layer medium', count: 218, intentValue: '£14,170', cartRate: '38%' },
    { query: 'carbon fibre trekking poles 120cm', count: 184, intentValue: '£13,800', cartRate: '29%' },
    { query: '3-season ultralight tent under 1.2kg', count: 146, intentValue: '£27,740', cartRate: '35%' },
    { query: 'waterproof trail running shoes size 10', count: 112, intentValue: '£16,788', cartRate: '48%' }
  ];

  const demandGaps = [
    { query: 'ultralight bivy bag under 350g', requests: 78, missedRevenue: '£9,360', status: 'Catalog Gap (No Match)' },
    { query: 'trail runners wide fit size 13', requests: 64, missedRevenue: '£8,960', status: 'Out of Stock (Zero Units)' },
    { query: 'down sleeping bag -10C rated', requests: 45, missedRevenue: '£11,250', status: 'Missing Category' }
  ];

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-6 space-y-6">
      
      {/* Header & Value Proposition Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Bot className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              BigCommerce Agent Visibility & Intent Intelligence
            </h1>
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
              Live Plugin Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Merchants are blind to AI-agent traffic today. This plugin makes agent demand visible, measurable, and transactable.
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-medium self-end md:self-auto">
          {(['today', '7d', '30d'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1 rounded transition capitalize ${
                timeRange === t ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'today' ? 'Today' : t === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Discovered Intent */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-300" />
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider font-mono">Discovered Intent Value</span>
              <span className="text-amber-400 font-mono text-[10px] font-bold">Unseen Demand</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight">
              £{baseIntent.toLocaleString()}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-slate-800/80">
            <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +42% vs last week
            </span>
            <span className="text-slate-500 text-[11px]">£84.10 avg basket</span>
          </div>
        </div>

        {/* KPI 2: Total Agent Sessions */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider font-mono">Agent Sessions</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight">
              {baseSessions.toLocaleString()}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-slate-800/80">
            <span className="text-cyan-400 font-mono font-semibold">100% Verified MCP</span>
            <span className="text-slate-500 text-[11px]">0 bot scraping errors</span>
          </div>
        </div>

        {/* KPI 3: Total Tool Calls */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider font-mono">MCP Tool Executions</span>
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight">
              {baseToolCalls.toLocaleString()}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-slate-800/80">
            <span className="text-purple-400 font-mono font-semibold">6.02 calls/session</span>
            <span className="text-slate-500 text-[11px]">22ms avg latency</span>
          </div>
        </div>

        {/* KPI 4: Staged Cart Value */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider font-mono">Staged Cart Value</span>
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono tracking-tight">
              £{baseCart.toLocaleString()}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-slate-800/80">
            <span className="text-emerald-400 font-mono font-semibold">34.4% Conversion</span>
            <span className="text-slate-500 text-[11px]">15-min soft locks</span>
          </div>
        </div>

      </div>

      {/* Second Row: Agent Providers Breakdown & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Agent Provider Distribution (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-sm">Agent Client Distribution</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">4 LLM Engines</span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Identify which AI models are routing shoppers to your store.
            </p>

            <div className="space-y-3">
              {agentProviders.map(p => (
                <div key={p.name} className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="font-semibold text-slate-200">{p.name}</span>
                    </div>
                    <span className="font-mono text-slate-300 font-bold">{p.share}% ({p.sessions} ses)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${p.share}%`, background: p.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Protocol Transport: HTTP/SSE 2024-11-05</span>
            <span className="text-emerald-400">100% Compliant</span>
          </div>
        </div>

        {/* Top Discovered Queries (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-slate-100 text-sm">Top Agent Search Intent Queries</h3>
              </div>
              <span className="text-[11px] text-cyan-400 font-mono">Structured Intent</span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Exact commercial queries synthesized by AI agents browsing your catalog over MCP.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase">
                    <th className="pb-2">Search Query String</th>
                    <th className="pb-2 text-right">Volume</th>
                    <th className="pb-2 text-right">Discovered Intent</th>
                    <th className="pb-2 text-right">Cart Add %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {topQueries.map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 text-slate-200 font-sans font-medium">{q.query}</td>
                      <td className="py-2.5 text-right text-slate-400">{q.count}</td>
                      <td className="py-2.5 text-right text-amber-400 font-bold">{q.intentValue}</td>
                      <td className="py-2.5 text-right text-emerald-400 font-bold">{q.cartRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Captured via <code>search_products</code> tool telemetry</span>
            <span className="text-indigo-400 font-mono font-semibold">Zero Screen-Scraping Overhead</span>
          </div>
        </div>

      </div>

      {/* Third Row: Missed Revenue & Demand Gaps (The Merchant Merchandising Goldmine) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-slate-100 text-sm">Agent Demand Gaps & Lost Revenue Insights</h3>
          </div>
          <span className="text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
            Merchandising Actionable
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          When AI agents search for products that are out-of-stock or missing from your catalog, the plugin logs the demand so merchants can restock high-converting inventory.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {demandGaps.map((gap, i) => (
            <div key={i} className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-200 mb-1">"{gap.query}"</div>
                <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-500/20">
                  {gap.status}
                </span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{gap.requests} Agent Requests</span>
                <span className="text-amber-400 font-bold">~{gap.missedRevenue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
