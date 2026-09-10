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
      <div className="w-full lg:w-96 bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col items-center justify-center text-zinc-400 space-y-4">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <Shield className="w-5 h-5 text-zinc-400 animate-spin" />
        </div>
        <div className="text-center">
          <h4 className="text-xs font-semibold text-zinc-200">Evaluating Epistemic Pipeline...</h4>
          <p className="text-[11px] text-zinc-500 mt-1 font-mono">
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
      case 'CRITICAL': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'HIGH': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'LOW': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      default: return 'text-zinc-400 bg-zinc-900 border-zinc-800';
    }
  };

  const getProgressColor = (score: number, inverse = false) => {
    const effective = inverse ? 100 - score : score;
    if (effective >= 70) return 'bg-rose-500';
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
    <aside className="w-full lg:w-96 bg-zinc-950 border-l border-zinc-800 flex flex-col h-full overflow-y-auto text-zinc-200">
      
      {/* Sidebar Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Real-Time Analysis
          </span>
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center space-x-2">
            <span>Firewall Intelligence</span>
            <span className={`w-1.5 h-1.5 rounded-full ${hasAnalysis ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          </h2>
        </div>
        
        {/* Overall Risk Tag */}
        <div className={`px-2.5 py-1 rounded-md border font-mono text-[11px] font-medium uppercase tracking-wider flex items-center space-x-1.5 ${getRiskColor(riskLevel)}`}>
          <span>{riskLevel}</span>
          {overallScore !== null && <span>{overallScore}%</span>}
        </div>
      </div>

      {/* Epistemic Gate Banner */}
      {gate && (
        <div className={`px-4 py-2 border-b text-xs flex items-center justify-between ${
          gate.isEpistemicallyRelevant 
            ? 'bg-zinc-900/90 border-zinc-800 text-zinc-200' 
            : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400'
        }`}>
          <div className="flex items-center space-x-2">
            <span className={`w-1.5 h-1.5 rounded-full ${gate.isEpistemicallyRelevant ? 'bg-zinc-300' : 'bg-emerald-400'}`} />
            <span className="font-mono font-medium text-[11px] uppercase">
              Gate: {gate.category.replace('_', ' ')}
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {gate.isEpistemicallyRelevant ? 'Active Pipeline' : 'Benign Pass'}
          </span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-zinc-800 bg-zinc-900/60 p-1">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'metrics' ? 'bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Metrics
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'claims' ? 'bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Claims ({factuality?.claims.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'evidence' ? 'bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/60' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Evidence ({evidenceBalance?.evidenceItems.length ?? 0})
        </button>
      </div>

      {/* TAB 1: METRICS & TRAJECTORY */}
      {activeTab === 'metrics' && (
        <div className="p-4 space-y-5">
          
          {!hasAnalysis ? (
            <div className="p-6 text-center space-y-3 bg-zinc-900/50 border border-zinc-800 rounded-xl my-4">
              <Shield className="w-7 h-7 text-zinc-600 mx-auto" />
              <div className="text-xs font-semibold text-zinc-300">
                Awaiting Telemetry Stream
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed max-w-xs mx-auto">
                Send a message in the Live Firewall chat or execute an evaluation scenario to inspect real-time epistemic scores.
              </p>
            </div>
          ) : (
            <>
              {/* 4 Core Pillars */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                    Diagnostic Pillars
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Engineering Heuristics
                  </span>
                </div>

                {/* 1. Sycophancy */}
                <div className="bg-zinc-900 border border-zinc-800/80 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-zinc-200">Sycophancy &amp; Flattery</span>
                    <span className="font-mono text-zinc-200 font-semibold">{sycoScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getProgressColor(sycoScore || 0)}`}
                      style={{ width: `${sycoScore || 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                    {sycophancy?.reasoning}
                  </p>
                </div>

                {/* 2. Factual Support */}
                <div className="bg-zinc-900 border border-zinc-800/80 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-zinc-200">Factual Grounding</span>
                    <span className="font-mono text-emerald-400 font-semibold">{factScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getProgressColor(factScore || 0, true)}`}
                      style={{ width: `${factScore || 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                    {factuality?.summary}
                  </p>
                </div>

                {/* 3. Evidence Balance */}
                <div className="bg-zinc-900 border border-zinc-800/80 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-zinc-200">Evidence Balance</span>
                    <span className="font-mono text-zinc-200 font-semibold">{balanceScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getProgressColor(balanceScore || 0, true)}`}
                      style={{ width: `${balanceScore || 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                    {evidenceBalance?.explanation}
                  </p>
                </div>

                {/* 4. Reinforcement Risk */}
                <div className="bg-zinc-900 border border-zinc-800/80 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-zinc-200">Reinforcement Spiral</span>
                    <span className="font-mono text-zinc-200 font-semibold">{reinforceScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getProgressColor(reinforceScore || 0)}`}
                      style={{ width: `${reinforceScore || 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                    {trajectory?.explanation}
                  </p>
                </div>

              </div>

              {/* Belief Trajectory Mini-Chart */}
              {trajectoryChartData && trajectoryChartData.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800/80 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-zinc-300" />
                      <span className="text-xs font-medium text-zinc-200">Belief Trajectory</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">p(H) over {trajectoryChartData.length} turn(s)</span>
                  </div>
                  
                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trajectoryChartData}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#27272a" />
                        <XAxis dataKey="turn" stroke="#71717a" fontSize={10} tickLine={false} />
                        <YAxis domain={[0, 100]} stroke="#71717a" fontSize={10} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '11px', borderRadius: '6px' }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="userStance" 
                          name="User Stance %" 
                          stroke="#e4e4e7" 
                          strokeWidth={2} 
                          dot={{ r: 2.5 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="aiValidation" 
                          name="AI Validation %" 
                          stroke="#eab308" 
                          strokeWidth={1.5} 
                          strokeDasharray="3 3" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1 text-center">
                    Prototype estimate • Not a literal Bayesian posterior
                  </p>
                </div>
              )}

              {/* Active Intervention Info */}
              {analysis?.intervention && (
                <div className={`border rounded-lg p-3 text-xs ${
                  analysis.intervention.applied 
                    ? 'bg-amber-500/5 border-amber-500/20' 
                    : 'bg-zinc-900 border-zinc-800'
                }`}>
                  <div className="flex items-center space-x-2 font-medium mb-1 text-zinc-200">
                    <Shield className={`w-3.5 h-3.5 ${analysis.intervention.applied ? 'text-amber-400' : 'text-emerald-400'}`} />
                    <span>Intervention: {analysis.intervention.type}</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
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
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Decomposed Atomic Claims
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">
              Corpus Cross-Reference
            </span>
          </div>

          {factuality?.claims && factuality.claims.length > 0 ? (
            factuality.claims.map((claim) => {
              let badgeStyle = 'bg-zinc-800 text-zinc-400 border-zinc-700';
              let icon = <HelpCircle className="w-3.5 h-3.5" />;

              if (claim.status === 'supported') {
                badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                icon = <CheckCircle2 className="w-3.5 h-3.5" />;
              } else if (claim.status === 'contradicted') {
                badgeStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                icon = <XCircle className="w-3.5 h-3.5" />;
              } else if (claim.status === 'uncertain') {
                badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                icon = <AlertTriangle className="w-3.5 h-3.5" />;
              }

              return (
                <div key={claim.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-zinc-200 leading-relaxed font-medium">
                      "{claim.claim}"
                    </p>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-mono uppercase font-semibold flex items-center space-x-1 shrink-0 ${badgeStyle}`}>
                      {icon}
                      <span>{claim.status}</span>
                    </span>
                  </div>

                  {claim.evidenceSource && (
                    <div className="mt-2 text-[11px] text-zinc-400 flex items-center space-x-1">
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{claim.evidenceSource}</span>
                    </div>
                  )}

                  {claim.contradictoryEvidence && (
                    <div className="mt-2 p-2 bg-rose-500/5 border border-rose-500/20 rounded text-[11px] text-rose-300">
                      <strong className="text-rose-200">Counter-evidence:</strong> {claim.contradictoryEvidence}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-zinc-500">
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
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Multi-Perspective Evidence Pool
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">
              RAG Grounding
            </span>
          </div>

          {evidenceBalance?.evidenceItems && evidenceBalance.evidenceItems.length > 0 ? (
            evidenceBalance.evidenceItems.map((item) => {
              let tagStyle = 'bg-zinc-800 text-zinc-400 border border-zinc-700';
              if (item.classification === 'SUPPORTING') tagStyle = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
              if (item.classification === 'CONTRADICTORY') tagStyle = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
              if (item.classification === 'NEUTRAL') tagStyle = 'bg-zinc-800 text-zinc-300 border border-zinc-700';

              return (
                <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${tagStyle}`}>
                      {item.classification}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Relevance: {(item.relevanceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {item.snippet}
                  </p>
                  <div className="pt-1 text-[10px] text-zinc-400 font-mono flex items-center space-x-1">
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                    <span className="truncate">{item.source}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-zinc-500">
              {hasAnalysis 
                ? 'No empirical literature required for this non-epistemic or unindexed query.' 
                : 'No evidence retrieved yet. Enter an empirical hypothesis to trigger multi-perspective RAG.'}
            </div>
          )}
        </div>
      )}

      {/* Footer Model Notice */}
      <div className="mt-auto p-3 border-t border-zinc-800 bg-zinc-950 text-[10px] font-mono text-zinc-500 text-center">
        SYCOGUARD Epistemic Safety Engine • Active Gateway
      </div>
    </aside>
  );
};
