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
      <div className="w-full lg:w-96 glass-panel border-t lg:border-t-0 lg:border-l border-white/[0.08] p-6 flex flex-col items-center justify-center text-zinc-400 space-y-4 h-full">
        <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center">
          <Shield className="w-5 h-5 text-zinc-300 animate-spin" />
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
  const intent = analysis?.intent;
  const relevance = analysis?.responseRelevance;

  const overallScore = risk ? Math.round(risk.overallScore * 100) : null;
  const riskLevel: RiskLevel | 'STANDBY' = risk ? risk.level : 'STANDBY';

  const sycoScore = sycophancy ? Math.round(sycophancy.score * 100) : null;
  const factScore = factuality ? Math.round(factuality.score * 100) : null;
  const balanceScore = evidenceBalance ? Math.round(evidenceBalance.balanceScore * 100) : null;
  const reinforceScore = trajectory ? Math.round(trajectory.reinforcementScore * 100) : null;

  const signals = risk?.signals;
  const csScore = signals ? Math.round(signals.confirmationSeeking * 100) : (risk?.components?.confirmationSeeking !== undefined ? Math.round(risk.components.confirmationSeeking * 100) : null);
  const apScore = signals ? Math.round(signals.agreementPressure * 100) : (risk?.components?.agreementPressure !== undefined ? Math.round(risk.components.agreementPressure * 100) : null);
  const esScore = signals ? Math.round(signals.evidenceSuppression * 100) : (risk?.components?.evidenceSuppression !== undefined ? Math.round(risk.components.evidenceSuppression * 100) : null);
  const ucScore = signals ? Math.round(signals.unsupportedCertainty * 100) : (risk?.components?.unsupportedCertainty !== undefined ? Math.round(risk.components.unsupportedCertainty * 100) : null);
  const msScore = signals ? Math.round(signals.modelSycophancy * 100) : (sycophancy ? Math.round(sycophancy.score * 100) : null);
  const fgScore = signals ? Math.round(signals.factualGrounding * 100) : (factuality ? Math.round(factuality.score * 100) : null);

  const getRiskColor = (level: RiskLevel | 'STANDBY') => {
    switch (level) {
      case 'CRITICAL': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'HIGH': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'MODERATE':
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
    <aside className="w-full lg:w-96 glass-panel border-t lg:border-t-0 lg:border-l border-white/[0.08] flex flex-col h-full overflow-y-auto text-zinc-200">
      
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between sticky top-0 bg-black/40 backdrop-blur-xl z-10">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Real-Time Analysis
          </span>
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center space-x-2">
            <span>Firewall Intelligence</span>
            <span className={`w-1.5 h-1.5 rounded-full ${hasAnalysis ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
          </h2>
        </div>
        
        {/* Overall Risk Tag */}
        <div className={`px-2.5 py-1 rounded-full border font-mono text-[11px] font-medium uppercase tracking-wider flex items-center space-x-1.5 ${getRiskColor(riskLevel)}`}>
          <span>{riskLevel}</span>
          {overallScore !== null && <span>{overallScore}%</span>}
        </div>
      </div>

      {/* Epistemic Gate Banner */}
      {gate && (
        <div className={`px-4 py-2 border-b text-xs flex items-center justify-between ${
          gate.isEpistemicallyRelevant 
            ? 'bg-white/[0.04] border-white/[0.08] text-zinc-200' 
            : 'bg-white/[0.02] border-white/[0.05] text-zinc-400'
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
      <div className="flex border-b border-white/[0.08] bg-black/20 p-1.5">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'metrics' ? 'bg-white/10 text-zinc-100 shadow-sm border border-white/10 backdrop-blur-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Metrics
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'claims' ? 'bg-white/10 text-zinc-100 shadow-sm border border-white/10 backdrop-blur-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Claims ({factuality?.claims.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'evidence' ? 'bg-white/10 text-zinc-100 shadow-sm border border-white/10 backdrop-blur-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Evidence ({evidenceBalance?.evidenceItems.length ?? 0})
        </button>
      </div>

      {/* TAB 1: METRICS & TRAJECTORY */}
      {activeTab === 'metrics' && (
        <div className="p-4 space-y-4 flex-1 flex flex-col">
          
          {!hasAnalysis ? (
            <div className="my-auto p-6 text-center space-y-3 glass-panel-subtle rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto shadow-sm">
                <Shield className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="text-xs font-semibold text-zinc-200">
                Awaiting Telemetry Stream
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
                Send a message in the Live Firewall chat or execute an evaluation scenario to inspect real-time epistemic scores.
              </p>
            </div>
          ) : (
            <>
              {/* Response Grounding & Intent Alignment Diagnostics */}
              {relevance && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                      Response Grounding &amp; Relevance
                    </h3>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      relevance.status === 'ALIGNED' 
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' 
                        : relevance.status === 'PARTIALLY_ALIGNED'
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
                        : 'text-rose-400 bg-rose-500/10 border-rose-500/25'
                    }`}>
                      {relevance.status}
                    </span>
                  </div>

                  <div className="glass-card rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-300">Detected Intent</span>
                      <span className="font-mono text-zinc-100 text-[11px] bg-white/[0.05] px-2 py-0.5 rounded">
                        {intent?.intentType || 'QUERY'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-300">Primary Subject</span>
                      <span className="font-mono text-zinc-200 text-[11px] truncate max-w-[180px]">
                        {intent?.primaryTopic || 'General'}
                      </span>
                    </div>

                    {/* Grounding Score */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zinc-400">Relevance Alignment</span>
                        <span className="font-mono text-zinc-100 font-semibold">
                          {Math.round(relevance.overallRelevanceScore * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${Math.round(relevance.overallRelevanceScore * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Sub-scores */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/[0.06] text-center">
                      <div>
                        <div className="text-[10px] text-zinc-400">Intent</div>
                        <div className="text-xs font-mono font-medium text-zinc-200">
                          {Math.round(relevance.intentAlignmentScore * 100)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400">Topic</div>
                        <div className="text-xs font-mono font-medium text-zinc-200">
                          {Math.round(relevance.topicAlignmentScore * 100)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400">Context</div>
                        <div className="text-xs font-mono font-medium text-zinc-200">
                          {Math.round(relevance.contextAlignmentScore * 100)}%
                        </div>
                      </div>
                    </div>

                    {relevance.regenerated && (
                      <div className="text-[10px] font-mono text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md">
                        ⚡ Regenerated to enforce intent alignment
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Epistemic Risk Signals (User Message & LLM Draft Analysis) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                    Epistemic Risk Signals
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Dual Engine Analysis
                  </span>
                </div>

                <div className="glass-card rounded-xl p-3.5 space-y-3">
                  {/* Confirmation Seeking */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-zinc-200">Confirmation Seeking</span>
                      <span className="font-mono text-zinc-100 font-semibold">{csScore ?? 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${getProgressColor(csScore || 0)}`}
                        style={{ width: `${csScore || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Agreement Pressure */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-zinc-200">Agreement Pressure</span>
                      <span className="font-mono text-zinc-100 font-semibold">{apScore ?? 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${getProgressColor(apScore || 0)}`}
                        style={{ width: `${apScore || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Evidence Suppression */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-zinc-200">Evidence Suppression</span>
                      <span className="font-mono text-zinc-100 font-semibold">{esScore ?? 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${getProgressColor(esScore || 0)}`}
                        style={{ width: `${esScore || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Unsupported Certainty */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-zinc-200">Unsupported Certainty</span>
                      <span className="font-mono text-zinc-100 font-semibold">{ucScore ?? 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${getProgressColor(ucScore || 0)}`}
                        style={{ width: `${ucScore || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Secondary Features: Model Sycophancy & Factual Grounding */}
                  <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-zinc-500 block text-[10px]">Model Sycophancy (Draft):</span>
                      <span className="text-zinc-200 font-semibold">{msScore ?? 0}%</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-zinc-500 block text-[10px]">Factual Grounding:</span>
                      <span className="text-emerald-400 font-semibold">{fgScore ?? 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Risk Triggers & Escalations List */}
                {risk && risk.triggers && risk.triggers.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/[0.07] border border-amber-500/20 text-xs text-amber-200 space-y-1.5">
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase font-bold text-amber-300">
                      <span>Why Risk Was Elevated</span>
                      <span>{risk.level}</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-zinc-300 list-disc list-inside">
                      {risk.triggers.map((t, idx) => (
                        <li key={idx} className="leading-snug">{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 4 Core Diagnostic Pillars */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                    Diagnostic Pillars
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Engineering Heuristics
                  </span>
                </div>

                {/* 1. Sycophancy */}
                <div className="glass-card rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-zinc-200">Sycophancy &amp; Flattery</span>
                    <span className="font-mono text-zinc-200 font-semibold">{sycoScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
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
                <div className="glass-card rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-zinc-200">Factual Grounding</span>
                    <span className="font-mono text-emerald-400 font-semibold">{factScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
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
                <div className="glass-card rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-zinc-200">Evidence Balance</span>
                    <span className="font-mono text-zinc-200 font-semibold">{balanceScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
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
                <div className="glass-card rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-zinc-200">Reinforcement Spiral</span>
                    <span className="font-mono text-zinc-200 font-semibold">{reinforceScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
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

              {/* Sycophancy Breakdown Details */}
              {sycophancy && (
                <div className="glass-card rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-200">Validation Rationale</span>
                    <span className="text-[10px] font-mono uppercase text-zinc-400">
                      {(sycophancy as any).intentCategory || `${Math.round(sycophancy.score * 100)}% Disparity`}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {sycophancy.reasoning}
                  </p>
                  {sycophancy.detectedHypothesis && (
                    <div className="pt-2 border-t border-white/[0.06] text-[11px]">
                      <span className="font-mono text-zinc-400 block text-[10px] uppercase">User Hypothesized:</span>
                      <span className="text-zinc-200 italic">"{sycophancy.detectedHypothesis}"</span>
                    </div>
                  )}
                </div>
              )}

              {/* Belief Trajectory Mini-Chart */}
              {trajectoryChartData && trajectoryChartData.length > 0 && (
                <div className="glass-card rounded-lg p-3">
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
      <div className="mt-auto p-2.5 border-t border-white/[0.08] bg-black/30 text-[10px] font-mono text-zinc-500 text-center">
        SYCOGUARD Epistemic Safety Engine • Active Gateway
      </div>
    </aside>
  );
};
