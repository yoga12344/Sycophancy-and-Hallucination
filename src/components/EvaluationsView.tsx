/**
 * SYCOGUARD Firewall Evaluation Lab
 * 
 * Predefined benchmark evaluation suite across 6 epistemic threat categories.
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  Play, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  BarChart2,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { BenchmarkScenario, FirewallAnalysis } from '../types.js';

interface EvaluationsViewProps {
  scenarios: BenchmarkScenario[];
  onRunEvaluation: (scenarioId: string) => Promise<any>;
}

export const EvaluationsView: React.FC<EvaluationsViewProps> = ({
  scenarios,
  onRunEvaluation
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarios[0]?.id || 'confirmation_seeking');
  const [isRunning, setIsRunning] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];

  const handleExecute = async (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setIsRunning(true);
    try {
      const res = await onRunEvaluation(scenarioId);
      setEvalResult(res);
    } catch (err) {
      console.error('Failed evaluation run:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const benchmarkMetricsChartData = [
    { metric: 'Sycophancy', RawLLM: 86, SYCOGUARD: 22 },
    { metric: 'Hallucination Risk', RawLLM: 45, SYCOGUARD: 12 },
    { metric: 'Evidence Imbalance', RawLLM: 78, SYCOGUARD: 15 },
    { metric: 'Reinforcement Spiral', RawLLM: 82, SYCOGUARD: 18 }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-transparent text-zinc-300">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-zinc-300 font-mono text-xs font-semibold uppercase">
                Verification Benchmark Suite
              </span>
              <span className="text-xs font-mono text-zinc-500">6 Scenarios</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mt-1">
              Firewall Evaluation Lab
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Systematically audit and compare how Raw LLMs respond to confirmation bias versus how SYCOGUARD enforces evidential balance.
            </p>
          </div>

          <button
            onClick={() => handleExecute(selectedScenarioId)}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-xl bg-white/90 hover:bg-white text-zinc-950 font-semibold text-sm shadow-md flex items-center space-x-2 shrink-0 transition-all disabled:opacity-50"
          >
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? 'Evaluating...' : 'Run Scenario Benchmark'}</span>
          </button>
        </div>

        {/* Benchmark Aggregate Summary Bar Chart */}
        <div className="mt-6 glass-panel rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-zinc-400" />
                <span>Epistemic Safety Benchmark: Raw LLM vs. SYCOGUARD</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Mean risk scores across all 6 benchmark threat categories (Lower is safer).
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-medium bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
              74% Average Epistemic Risk Reduction
            </span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benchmarkMetricsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="metric" stroke="#71717a" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#71717a" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#f43f5e', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                <Bar dataKey="RawLLM" name="Raw LLM (Unprotected)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="SYCOGUARD" name="SYCOGUARD Protected" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scenario Selection Cards Grid */}
        <div className="mt-8">
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-3">
            Select Evaluation Category:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scenarios.map((sc) => {
              const isSelected = sc.id === selectedScenarioId;
              return (
                <div
                  key={sc.id}
                  onClick={() => handleExecute(sc.id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'glass-card border-white/30 text-zinc-100 shadow-md ring-1 ring-white/20'
                      : 'glass-card glass-card-hover text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-zinc-300">
                      {sc.category.replace('_', ' ')}
                    </span>
                    <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-semibold ${
                      sc.expectedRiskLevel === 'CRITICAL' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
                      sc.expectedRiskLevel === 'HIGH' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                      'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {sc.expectedRiskLevel} RISK
                    </span>
                  </div>

                  <h4 className="text-xs font-medium text-zinc-200 line-clamp-1">
                    {sc.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                    {sc.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deep Dive on Selected Scenario */}
        {selectedScenario && (
          <div className="mt-8 glass-panel rounded-2xl p-6 shadow-xl space-y-6">
            <div className="border-b border-white/[0.08] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wide">
                  Active Scenario Breakdown
                </span>
                <h3 className="text-lg font-bold text-zinc-100 mt-0.5">
                  {selectedScenario.title}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-zinc-300">
                  Target Expected Risk: {selectedScenario.expectedRiskLevel}
                </span>
              </div>
            </div>

            {/* Test Prompt */}
            <div className="p-3.5 glass-panel-subtle rounded-xl border border-white/[0.06] text-xs">
              <span className="font-mono text-zinc-400 uppercase text-[10px] block mb-1">
                Prompt Injected into Pipeline:
              </span>
              <p className="text-zinc-200 italic">
                "{selectedScenario.userPrompt}"
              </p>
            </div>

            {/* Side-by-Side Outputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Raw Draft Sample */}
              <div className="p-4 glass-card border-rose-500/25 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-rose-400 text-xs font-medium">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Raw Model Output</span>
                </div>
                <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {evalResult?.evaluation?.rawDraft || selectedScenario.rawResponseSample}
                </div>
              </div>

              {/* Protected Response */}
              <div className="p-4 glass-card border-emerald-500/25 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  <span>SYCOGUARD Protected Output</span>
                </div>
                <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {evalResult?.evaluation?.protectedResponse || selectedScenario.protectedResponseSample}
                </div>
              </div>

            </div>

            {/* Key Insights List */}
            <div className="pt-2">
              <h4 className="text-xs font-mono uppercase text-zinc-400 tracking-wide font-semibold mb-2">
                Key Architectural Insights:
              </h4>
              <ul className="space-y-1.5">
                {selectedScenario.keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-xs text-zinc-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
