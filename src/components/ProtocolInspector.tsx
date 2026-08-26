import React, { useState } from 'react';
import type { 
  JsonRpcFrame, 
  SecurityEvent, 
  McpToolDefinition 
} from '../types';
import { MERCHANT_MCP_TOOLS } from '../mcp/merchantMcpEngine';
import { 
  Zap, 
  Terminal, 
  ShieldCheck, 
  Layers, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  Copy, 
  Check,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2
} from 'lucide-react';

interface ProtocolInspectorProps {
  frames: JsonRpcFrame[];
  securityEvents: SecurityEvent[];
  onClearFrames: () => void;
}

export const ProtocolInspector: React.FC<ProtocolInspectorProps> = ({
  frames,
  securityEvents,
  onClearFrames
}) => {
  const [activeTab, setActiveTab] = useState<'stream' | 'tools' | 'security'>('stream');
  const [expandedFrameId, setExpandedFrameId] = useState<string | number | null>(null);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [selectedTool, setSelectedTool] = useState<McpToolDefinition>(MERCHANT_MCP_TOOLS[0]);

  const handleCopy = (id: string | number, content: any) => {
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const avgLatency = frames.length > 0
    ? Math.round(frames.filter(f => f.latencyMs).reduce((sum, f) => sum + (f.latencyMs || 0), 0) / (frames.filter(f => f.latencyMs).length || 1))
    : 16;

  const totalTokensSaved = frames.reduce((sum, f) => {
    if (f.tokenStats) {
      return sum + (f.tokenStats.rawDomEquivalentTokens - f.tokenStats.mcpPayloadTokens);
    }
    return sum;
  }, 0);

  return (
    <div className="bg-slate-950 text-slate-100 flex flex-col h-full overflow-hidden border-r border-slate-800">
      
      {/* HUD Top Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-3 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <div>
            <span className="font-bold text-slate-100 text-sm tracking-tight font-mono">Web MCP Wire HUD</span>
            <div className="text-[10px] text-slate-400 font-mono">Transport: HTTP/SSE 2024-11-05</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('stream')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition ${
                activeTab === 'stream' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>Frames ({frames.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tools')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition ${
                activeTab === 'tools' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Tools ({MERCHANT_MCP_TOOLS.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition ${
                activeTab === 'security' 
                  ? 'bg-cyan-600 text-white font-semibold' 
                  : securityEvents.length > 0 
                    ? 'text-amber-400 font-semibold' 
                    : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Guard {securityEvents.length > 0 && `(${securityEvents.length})`}</span>
            </button>
          </div>

          {frames.length > 0 && (
            <button
              onClick={onClearFrames}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
              title="Clear Wire Log"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Real-Time Metrics Strip */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-3 py-2 grid grid-cols-3 gap-2 text-center text-xs font-mono shrink-0">
        <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase">Avg Latency</div>
          <div className="text-emerald-400 font-bold flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-emerald-500" />
            <span>{avgLatency}ms</span>
          </div>
        </div>

        <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase">Token Egress Saved</div>
          <div className="text-cyan-400 font-bold flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-cyan-500" />
            <span>{totalTokensSaved > 0 ? `${(totalTokensSaved / 1000).toFixed(1)}k tok` : '94.2%'}</span>
          </div>
        </div>

        <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase">Protocol Standard</div>
          <div className="text-indigo-300 font-bold">JSON-RPC 2.0</div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
        
        {/* Stream Tab */}
        {activeTab === 'stream' && (
          <div className="space-y-2">
            {frames.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs font-sans text-center">
                <Terminal className="w-8 h-8 mb-2 stroke-[1.5] text-slate-600" />
                <p>Waiting for agent MCP requests...</p>
                <p className="text-[11px] text-slate-600 mt-1">Run a scenario in the Agent Simulator panel.</p>
              </div>
            ) : (
              frames.map((frame, index) => {
                const isExpanded = expandedFrameId === (frame.id + '_' + index);
                const isRequest = frame.type === 'request';
                const isError = frame.type === 'error';

                return (
                  <div
                    key={`${frame.id}_${index}`}
                    className={`rounded-lg border transition ${
                      isError 
                        ? 'bg-rose-950/20 border-rose-800/60' 
                        : isRequest 
                          ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' 
                          : 'bg-slate-900/90 border-cyan-900/40 hover:border-cyan-700/60'
                    }`}
                  >
                    {/* Frame Header */}
                    <div 
                      onClick={() => setExpandedFrameId(isExpanded ? null : `${frame.id}_${index}`)}
                      className="p-2.5 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        {isRequest ? (
                          <span className="p-1 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            <ArrowUpRight className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="p-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            <ArrowDownLeft className="w-3 h-3" />
                          </span>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold uppercase text-[11px] ${
                              isError ? 'text-rose-400' : isRequest ? 'text-indigo-400' : 'text-cyan-400'
                            }`}>
                              {frame.method || frame.type}
                            </span>
                            {frame.toolName && (
                              <span className="bg-slate-800 text-slate-200 px-1.5 py-0.2 rounded text-[10px]">
                                {frame.toolName}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">{frame.timestamp}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {frame.latencyMs !== undefined && (
                          <span className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                            {frame.latencyMs}ms
                          </span>
                        )}
                        {frame.tokenStats && (
                          <span className="text-[10px] bg-emerald-950/60 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 hidden sm:inline">
                            -{frame.tokenStats.reductionPercentage}% tokens
                          </span>
                        )}
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                    </div>

                    {/* Frame Body (Expanded) */}
                    {isExpanded && (
                      <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 rounded-b-lg">
                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase">JSON-RPC 2.0 Payload</span>
                          <button
                            onClick={() => handleCopy(`${frame.id}_${index}`, frame)}
                            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200"
                          >
                            {copiedId === `${frame.id}_${index}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === `${frame.id}_${index}` ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                          {JSON.stringify(isRequest ? frame.params : (frame.result || frame.error), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tools Catalog Tab */}
        {activeTab === 'tools' && (
          <div className="space-y-4">
            <div className="text-[11px] text-slate-400 font-sans">
              The merchant plugin exports the following typed tools over MCP:
            </div>

            <div className="grid grid-cols-1 gap-2">
              {MERCHANT_MCP_TOOLS.map(tool => (
                <div
                  key={tool.name}
                  onClick={() => setSelectedTool(tool)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    selectedTool.name === tool.name 
                      ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/30' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400 text-xs font-mono">{tool.name}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                      {Object.keys(tool.inputSchema.properties).length} params
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans mt-1 leading-snug">
                    {tool.description}
                  </p>

                  {/* Schema parameters */}
                  {selectedTool.name === tool.name && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px]">
                      <span className="text-slate-400 uppercase font-mono block mb-1.5">Input Parameters:</span>
                      <div className="space-y-1">
                        {Object.entries(tool.inputSchema.properties).map(([paramName, param]) => (
                          <div key={paramName} className="bg-slate-950 p-1.5 rounded border border-slate-800/80">
                            <div className="flex items-center gap-1.5">
                              <span className="text-indigo-400 font-bold">{paramName}</span>
                              <span className="text-slate-500">({param.type})</span>
                              {tool.inputSchema.required?.includes(paramName) && (
                                <span className="text-rose-400 text-[9px] font-mono font-bold">REQUIRED</span>
                              )}
                            </div>
                            <p className="text-slate-400 text-[10px] font-sans mt-0.5">{param.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Events Tab */}
        {activeTab === 'security' && (
          <div className="space-y-3">
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-100 text-xs">Edge Guard Active</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Automatic prompt injection sanitization, inventory hoarding prevention, and rate-limiting safeguards running directly inside the merchant MCP proxy.
              </p>
            </div>

            {securityEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs font-sans">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p>No security anomalies detected.</p>
                <p className="text-[11px] text-slate-600 mt-1">Try running the "Adversarial Injection Defense" scenario.</p>
              </div>
            ) : (
              securityEvents.map(evt => (
                <div key={evt.id} className="bg-amber-950/20 border border-amber-500/40 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{evt.type.toUpperCase()}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{evt.timestamp}</span>
                  </div>

                  <p className="text-[11px] text-slate-300 font-sans">{evt.description}</p>

                  <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[10px]">
                    <span className="text-slate-500 block mb-0.5">Intercepted Malicious Content:</span>
                    <code className="text-amber-300 break-all">{evt.rawInput}</code>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Action: <strong className="text-emerald-400 uppercase">{evt.actionTaken}</strong></span>
                    <span className="text-slate-500 font-mono">Status: NEUTRALIZED</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};
