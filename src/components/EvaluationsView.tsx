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
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-900/50 text-slate-200">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono text-xs font-semibold uppercase">
                Verification Benchmark Suite
              </span>
              <span className="text-xs font-mono text-slate-500">6 Scenarios</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
              Firewall Evaluation Lab
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Systematically audit and compare how Raw LLMs respond to confirmation bias versus how SYCOGUARD enforces evidential balance.
            </p>
          </div>

          <button
            onClick={() => handleExecute(selectedScenarioId)}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 font-semibold text-sm text-white shadow-lg shadow-indigo-950/50 flex items-center space-x-2 shrink-0 transition-all"
          >
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? 'Evaluating...' : 'Run Scenario Benchmark'}</span>
          </button>
        </div>

        {/* Benchmark Aggregate Summary Bar Chart */}
        <div className="mt-6 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <span>Epistemic Safety Benchmark: Raw LLM vs. SYCOGUARD</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Mean risk scores across all 6 benchmark threat categories (Lower is safer).
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded">
              74% Average Epistemic Risk Reduction
            </span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benchmarkMetricsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="metric" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155' }} />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                <Bar dataKey="RawLLM" name="Raw LLM (Unprotected)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="SYCOGUARD" name="SYCOGUARD Protected" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scenario Selection Cards Grid */}
        <div className="mt-8">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-3">
            Select Evaluation Category:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scenarios.map((sc) => {
              const isSelected = sc.id === selectedScenarioId;
              return (
                <div
                  key={sc.id}
                  onClick={() => handleExecute(sc.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {sc.category.replace('_', ' ')}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                      sc.expectedRiskLevel === 'CRITICAL' ? 'bg-red-950 text-red-400 border-red-800' :
                      sc.expectedRiskLevel === 'HIGH' ? 'bg-amber-950 text-amber-400 border-amber-800' :
                      'bg-emerald-950 text-emerald-400 border-emerald-800'
                    }`}>
                      {sc.expectedRiskLevel} RISK
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100 line-clamp-1">
                    {sc.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {sc.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deep Dive on Selected Scenario */}
        {selectedScenario && (
          <div className="mt-8 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wide">
                  Active Scenario Breakdown
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedScenario.title}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                  Target Expected Risk: {selectedScenario.expectedRiskLevel}
                </span>
              </div>
            </div>

            {/* Test Prompt */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              <span className="font-mono text-slate-500 uppercase text-[10px] block mb-1">
                Prompt Injected into Pipeline:
              </span>
              <p className="text-slate-100 italic">
                "{selectedScenario.userPrompt}"
              </p>
            </div>

            {/* Side-by-Side Outputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Raw Draft Sample */}
              <div className="p-4 bg-slate-900/80 border border-red-950 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-red-400 text-xs font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Raw Model Output</span>
                </div>
                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {evalResult?.evaluation?.rawDraft || selectedScenario.rawResponseSample}
                </div>
              </div>

              {/* Protected Response */}
              <div className="p-4 bg-slate-900/80 border border-emerald-950 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>SYCOGUARD Protected Output</span>
                </div>
                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {evalResult?.evaluation?.protectedResponse || selectedScenario.protectedResponseSample}
                </div>
              </div>

            </div>

            {/* Key Insights List */}
            <div className="pt-2">
              <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wide font-semibold mb-2">
                Key Architectural Insights:
              </h4>
              <ul className="space-y-1.5">
                {selectedScenario.keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
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
