/**
 * SYCOGUARD Firewall Intelligence Risk Sidebar
 * 
 * Shows composite epistemic risk, Epistemic Relevance Gate status,
 * 4 core diagnostic metrics, trajectory mini-chart, atomic claim status,
 * and retrieved empirical evidence sources.
 */

import React, { useState } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  TrendingUp, 
  Layers, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Info,
  Sliders
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { FirewallAnalysis, RiskLevel } from '../types.js';

interface RiskSidebarProps {
  analysis?: FirewallAnalysis;
  isLoading?: boolean;
}

export const RiskSidebar: React.FC<RiskSidebarProps> = ({ analysis, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'claims' | 'evidence'>('metrics');
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="w-full lg:w-96 bg-slate-950 border-l border-slate-800 p-6 flex flex-col items-center justify-center text-slate-400 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-800 flex items-center justify-center animate-pulse">
          <Shield className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
        <div className="text-center">
          <h4 className="text-sm font-semibold text-slate-200">Evaluating Epistemic Pipeline...</h4>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Epistemic Gate • Sycophancy • Factuality • Balance • Trajectory
          </p>
        </div>
      </div>
    );
  }

  const hasAnalysis = Boolean(analysis);
  const risk = analysis?.risk;
  const sycophancy = analysis?.sycophancy;
  const factuality = analysis?.factuality;
  const evidenceBalance = analysis?.evidenceBalance;
  const trajectory = analysis?.trajectory;
  const gate = analysis?.epistemicRelevance;

  const overallScore = risk ? Math.round(risk.overallScore * 100) : null;
  const riskLevel: RiskLevel | 'STANDBY' = risk ? risk.level : 'STANDBY';

  const sycoScore = sycophancy ? Math.round(sycophancy.score * 100) : null;
  const factScore = factuality ? Math.round(factuality.score * 100) : null;
  const balanceScore = evidenceBalance ? Math.round(evidenceBalance.balanceScore * 100) : null;
  const reinforceScore = trajectory ? Math.round(trajectory.reinforcementScore * 100) : null;

  const getRiskColor = (level: RiskLevel | 'STANDBY') => {
    switch (level) {
      case 'CRITICAL': return 'text-red-400 bg-red-950/40 border-red-800';
      case 'HIGH': return 'text-amber-400 bg-amber-950/40 border-amber-800';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-950/40 border-yellow-800';
      case 'LOW': return 'text-emerald-400 bg-emerald-950/40 border-emerald-800';
      default: return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  const getProgressColor = (score: number, inverse = false) => {
    const effective = inverse ? 100 - score : score;
    if (effective >= 70) return 'bg-red-500';
    if (effective >= 45) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const trajectoryChartData = trajectory?.stanceHistory && trajectory.stanceHistory.length > 0
    ? trajectory.stanceHistory.map((pt) => ({
        turn: `T${pt.turn}`,
        userStance: Math.round(pt.userStance * 100),
        aiValidation: Math.round(pt.aiValidation * 100),
        risk: Math.round(pt.rawRisk * 100)
      }))
    : null;

  return (
    <aside className="w-full lg:w-96 bg-slate-950 border-l border-slate-800 flex flex-col h-full overflow-y-auto text-slate-200">
      
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-950/95 backdrop-blur z-10">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Real-Time Analysis
          </span>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Firewall Intelligence</span>
            <span className={`w-2 h-2 rounded-full ${hasAnalysis ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
          </h2>
        </div>
        
        {/* Overall Risk Tag */}
        <div className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 ${getRiskColor(riskLevel)}`}>
          <span>{riskLevel}</span>
          {overallScore !== null && <span>{overallScore}%</span>}
        </div>
      </div>

      {/* Epistemic Gate Banner */}
      {gate && (
        <div className={`px-4 py-2.5 border-b text-xs flex items-center justify-between ${
          gate.isEpistemicallyRelevant 
            ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-200' 
            : 'bg-slate-900/60 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${gate.isEpistemicallyRelevant ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
            <span className="font-mono font-semibold text-[11px] uppercase">
              Gate: {gate.category.replace('_', ' ')}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {gate.isEpistemicallyRelevant ? 'Active Pipeline' : 'Benign Pass'}
          </span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/50 p-1">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'metrics' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Metrics
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'claims' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Claims ({factuality?.claims.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'evidence' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Evidence ({evidenceBalance?.evidenceItems.length ?? 0})
        </button>
      </div>

      {/* TAB 1: METRICS & TRAJECTORY */}
      {activeTab === 'metrics' && (
        <div className="p-4 space-y-5">
          
          {!hasAnalysis ? (
            <div className="p-6 text-center space-y-3 bg-slate-900/30 border border-slate-800/80 rounded-xl my-4">
              <Shield className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-xs font-semibold text-slate-300">
                Awaiting Telemetry Stream
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                Send a message in the Live Firewall chat or execute an evaluation scenario to inspect real-time epistemic scores.
              </p>
            </div>
          ) : (
            <>
              {/* 4 Core Pillars */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Diagnostic Pillars
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">
                    Engineering Heuristics
                  </span>
                </div>

                {/* 1. Sycophancy */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-200">Sycophancy &amp; Flattery</span>
                    <span className="font-mono text-cyan-400 font-bold">{sycoScore}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getProgressColor(sycoScore || 0)}`}
                      style={{ width: `${sycoScore || 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    {sycophancy?.reasoning}
                  </p>
                </div>

                {/* 2. Factual Support */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-200">Factual Grounding</span>
                    <span className="font-mono text-emerald-400 font-bold">{factScore}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getProgressColor(factScore || 0, true)}`}
                      style={{ width: `${factScore || 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    {factuality?.summary}
                  </p>
                </div>

                {/* 3. Evidence Balance */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-200">Evidence Balance</span>
                    <span className="font-mono text-indigo-400 font-bold">{balanceScore}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getProgressColor(balanceScore || 0, true)}`}
                      style={{ width: `${balanceScore || 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    {evidenceBalance?.explanation}
                  </p>
                </div>

                {/* 4. Reinforcement Risk */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-200">Reinforcement Spiral</span>
                    <span className="font-mono text-pink-400 font-bold">{reinforceScore}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getProgressColor(reinforceScore || 0)}`}
                      style={{ width: `${reinforceScore || 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    {trajectory?.explanation}
                  </p>
                </div>

              </div>

              {/* Belief Trajectory Mini-Chart */}
              {trajectoryChartData && trajectoryChartData.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-xs font-semibold text-slate-200">Belief Trajectory</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">p(H) over {trajectoryChartData.length} turn(s)</span>
                  </div>
                  
                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trajectoryChartData}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                        <XAxis dataKey="turn" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '11px' }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="userStance" 
                          name="User Stance %" 
                          stroke="#38bdf8" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="aiValidation" 
                          name="AI Validation %" 
                          stroke="#fbbf24" 
                          strokeWidth={1.5} 
                          strokeDasharray="3 3" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 text-center">
                    Prototype estimate • Not a literal Bayesian posterior
                  </p>
                </div>
              )}

              {/* Active Intervention Info */}
              {analysis?.intervention && (
                <div className={`border rounded-lg p-3 text-xs ${
                  analysis.intervention.applied 
                    ? 'bg-amber-950/30 border-amber-900/50' 
                    : 'bg-slate-900/60 border-slate-800'
                }`}>
                  <div className="flex items-center space-x-2 font-semibold mb-1 text-slate-200">
                    <Shield className={`w-4 h-4 ${analysis.intervention.applied ? 'text-amber-400' : 'text-emerald-400'}`} />
                    <span>Intervention: {analysis.intervention.type}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {analysis.intervention.reason}
                  </p>
                </div>
              )}
            </>
          )}

        </div>
      )}

      {/* TAB 2: ATOMIC CLAIMS */}
      {activeTab === 'claims' && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Decomposed Atomic Claims
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              Corpus Cross-Reference
            </span>
          </div>

          {factuality?.claims && factuality.claims.length > 0 ? (
            factuality.claims.map((claim) => {
              let badgeStyle = 'bg-slate-800 text-slate-400 border-slate-700';
              let icon = <HelpCircle className="w-3.5 h-3.5" />;

              if (claim.status === 'supported') {
                badgeStyle = 'bg-emerald-950/60 text-emerald-400 border-emerald-800';
                icon = <CheckCircle2 className="w-3.5 h-3.5" />;
              } else if (claim.status === 'contradicted') {
                badgeStyle = 'bg-red-950/60 text-red-400 border-red-800';
                icon = <XCircle className="w-3.5 h-3.5" />;
              } else if (claim.status === 'uncertain') {
                badgeStyle = 'bg-amber-950/60 text-amber-400 border-amber-800';
                icon = <AlertTriangle className="w-3.5 h-3.5" />;
              }

              return (
                <div key={claim.id} className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-slate-200 leading-relaxed font-medium">
                      "{claim.claim}"
                    </p>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-mono uppercase font-semibold flex items-center space-x-1 shrink-0 ${badgeStyle}`}>
                      {icon}
                      <span>{claim.status}</span>
                    </span>
                  </div>

                  {claim.evidenceSource && (
                    <div className="mt-2 text-[11px] text-cyan-400/90 flex items-center space-x-1">
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{claim.evidenceSource}</span>
                    </div>
                  )}

                  {claim.contradictoryEvidence && (
                    <div className="mt-2 p-2 bg-red-950/30 border border-red-900/40 rounded text-[11px] text-red-300">
                      <strong>Counter-evidence:</strong> {claim.contradictoryEvidence}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">
              {hasAnalysis 
                ? 'No atomic claims required verification for this conversational turn.' 
                : 'No atomic claims extracted yet. Send a message to run the factuality decomposition engine.'}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RETRIEVED EVIDENCE */}
      {activeTab === 'evidence' && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Multi-Perspective Evidence Pool
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              RAG Grounding
            </span>
          </div>

          {evidenceBalance?.evidenceItems && evidenceBalance.evidenceItems.length > 0 ? (
            evidenceBalance.evidenceItems.map((item) => {
              let tagStyle = 'bg-slate-800 text-slate-400';
              if (item.classification === 'SUPPORTING') tagStyle = 'bg-emerald-950/60 text-emerald-400 border border-emerald-800';
              if (item.classification === 'CONTRADICTORY') tagStyle = 'bg-red-950/60 text-red-400 border border-red-800';
              if (item.classification === 'NEUTRAL') tagStyle = 'bg-indigo-950/60 text-indigo-400 border border-indigo-800';

              return (
                <div key={item.id} className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${tagStyle}`}>
                      {item.classification}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Relevance: {(item.relevanceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {item.snippet}
                  </p>
                  <div className="pt-1 text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                    <ExternalLink className="w-3 h-3 text-cyan-400" />
                    <span className="truncate">{item.source}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">
              {hasAnalysis 
                ? 'No empirical literature required for this non-epistemic or unindexed query.' 
                : 'No evidence retrieved yet. Enter an empirical hypothesis to trigger multi-perspective RAG.'}
            </div>
          )}
        </div>
      )}

      {/* Footer Model Notice */}
      <div className="mt-auto p-3 border-t border-slate-800/80 bg-slate-950 text-[10px] font-mono text-slate-500 text-center">
        SYCOGUARD Epistemic Safety Engine • Active Gateway
      </div>
    </aside>
  );
};
