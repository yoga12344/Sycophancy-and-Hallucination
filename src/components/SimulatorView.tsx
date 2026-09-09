/**
 * SYCOGUARD Mode C: Research Simulator
 * 
 * Interactive Bayesian Sycophancy Simulator inspired by:
 * "Sycophantic Chatbots Cause Delusional Spiraling, Even in Ideal Bayesians"
 */

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Activity, 
  AlertTriangle, 
  BookOpen, 
  RefreshCw, 
  BarChart3, 
  TrendingUp,
  Cpu,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  BarChart, 
  Bar 
} from 'recharts';
import { SimulationConfig, SimulationResult } from '../types.js';

interface SimulatorViewProps {
  onRunSimulation: (config: SimulationConfig) => Promise<SimulationResult>;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({ onRunSimulation }) => {
  const [config, setConfig] = useState<SimulationConfig>({
    sycophancyPi: 0.70,
    rounds: 25,
    numSimulations: 30,
    botType: 'sycophantic',
    factuality: 'factual',
    userType: 'naive',
    worldTruth: 'H0',
    priorP1: 0.50
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const executeSimulation = async (customConfig?: SimulationConfig) => {
    setIsRunning(true);
    try {
      const res = await onRunSimulation(customConfig || config);
      setResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    executeSimulation();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-900/50 text-slate-200">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono text-xs font-semibold uppercase">
                Paper-Inspired Experiment
              </span>
              <span className="text-xs font-mono text-slate-500">Mode C</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
              Bayesian Sycophancy Simulation
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Simulates repeated multi-turn interactions between an agent and a Bayesian user.
              Tests how sycophancy parameter π induces delusional spiraling even in mathematically ideal Bayesian agents.
            </p>
          </div>

          <button
            onClick={() => executeSimulation()}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 font-semibold text-sm text-white shadow-lg shadow-cyan-950/50 flex items-center space-x-2 shrink-0 transition-all"
          >
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? 'Running Monte Carlo...' : 'Run Simulation'}</span>
          </button>
        </div>

        {/* Interactive Controls Panel */}
        <div className="mt-6 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Experimental Parameters</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              Monte Carlo Sample N = {config.numSimulations}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            
            {/* Control 1: Sycophancy π Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200">Sycophancy Parameter π</label>
                <span className="font-mono text-cyan-400 font-bold text-sm">
                  {config.sycophancyPi.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={config.sycophancyPi}
                onChange={(e) => setConfig({ ...config, sycophancyPi: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 bg-slate-800"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0.00 (Fair / Unbiased)</span>
                <span>0.50 (50% Bias)</span>
                <span>1.00 (Pure Sycophant)</span>
              </div>
            </div>

            {/* Control 2: Conversation Rounds */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-200 block">Conversation Rounds (Turns)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[10, 25, 50, 100].map((r) => (
                  <button
                    key={r}
                    onClick={() => setConfig({ ...config, rounds: r })}
                    className={`py-1.5 rounded-lg border font-mono text-xs font-medium transition-colors ${
                      config.rounds === r 
                        ? 'bg-cyan-950 border-cyan-700 text-cyan-300' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Control 3: World Ground Truth */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-200 block">World Ground Truth</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfig({ ...config, worldTruth: 'H0' })}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition-colors ${
                    config.worldTruth === 'H0'
                      ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  H0: User Hypothesis is FALSE
                </button>
                <button
                  onClick={() => setConfig({ ...config, worldTruth: 'H1' })}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition-colors ${
                    config.worldTruth === 'H1'
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  H1: User Hypothesis is TRUE
                </button>
              </div>
            </div>

            {/* Control 4: Bot Factuality */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-200 block">Bot Factuality Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfig({ ...config, factuality: 'factual' })}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                    config.factuality === 'factual'
                      ? 'bg-indigo-950/80 border-indigo-700 text-indigo-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Factual Sycophancy (Selective Truth)
                </button>
                <button
                  onClick={() => setConfig({ ...config, factuality: 'fabricating' })}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                    config.factuality === 'fabricating'
                      ? 'bg-red-950/60 border-red-700 text-red-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Fabricating Bot (Hallucinations)
                </button>
              </div>
            </div>

            {/* Control 5: User Bayesian Awareness */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-200 block">User Cognitive Model</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfig({ ...config, userType: 'naive' })}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                    config.userType === 'naive'
                      ? 'bg-cyan-950 border-cyan-700 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Naïve Bayesian (Assumes π=0)
                </button>
                <button
                  onClick={() => setConfig({ ...config, userType: 'sycophancy_aware' })}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                    config.userType === 'sycophancy_aware'
                      ? 'bg-cyan-950 border-cyan-700 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sycophancy-Aware (Estimates π̂)
                </button>
              </div>
            </div>

            {/* Control 6: Bot Behavior Type */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-200 block">Bot Baseline</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfig({ ...config, botType: 'sycophantic' })}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                    config.botType === 'sycophantic'
                      ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sycophantic Agent (π={config.sycophancyPi})
                </button>
                <button
                  onClick={() => setConfig({ ...config, botType: 'fair' })}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                    config.botType === 'fair'
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Fair Baseline (π=0)
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Results Visualizations */}
        {result && (
          <div className="mt-6 space-y-6">
            
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <span className="text-[11px] font-mono text-slate-500 uppercase">
                  Delusional Spiral Risk
                </span>
                <div className="text-2xl font-bold font-mono text-red-400 mt-1">
                  {result.spiralRiskPercentage}%
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Simulations where belief escalated to false certainty (p ≥ 0.85).
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <span className="text-[11px] font-mono text-slate-500 uppercase">
                  Avg Final Belief p(H1)
                </span>
                <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                  {(result.averageFinalConfidence * 100).toFixed(1)}%
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Fair baseline: {(result.fairAverageFinalConfidence * 100).toFixed(1)}%
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <span className="text-[11px] font-mono text-slate-500 uppercase">
                  Epistemic Distortion
                </span>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                  +{((result.averageFinalConfidence - result.fairAverageFinalConfidence) * 100).toFixed(1)}%
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Excess certainty induced solely by sycophantic validation.
                </p>
              </div>
            </div>

            {/* Chart 1: Multi-Turn Belief Trajectory */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span>Belief Trajectory Over Conversation Rounds</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Comparison of user posterior p(H1) in Sycophantic condition vs Fair Bot baseline.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  Target Hypothesis Truth = {config.worldTruth}
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.roundsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="round" stroke="#64748b" label={{ value: 'Conversation Round t', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }} />
                    <YAxis domain={[0, 1]} stroke="#64748b" label={{ value: 'Posterior p_t(H1)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155' }} />
                    <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                    <Line 
                      type="monotone" 
                      dataKey="avgBelief" 
                      name="Sycophantic Chatbot (π > 0)" 
                      stroke="#f43f5e" 
                      strokeWidth={3} 
                      dot={false} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="fairAvgBelief" 
                      name="Fair Chatbot Baseline (π = 0)" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      strokeDasharray="4 4" 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-slate-400 mt-4 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <strong>Simulation Analysis:</strong> {result.summary}
              </p>
            </div>

            {/* Chart 2: Final Belief Distribution Histogram */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    <span>Final Belief Distribution (Histogram)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Distribution of user posterior beliefs after {config.rounds} interaction rounds across all {config.numSimulations} simulations.
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.finalDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="bin" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155' }} />
                    <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                    <Bar dataKey="count" name="Sycophantic Bot Runs" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="fairCount" name="Fair Bot Runs" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mathematical & Theoretical Epistemic Layer */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
              <div className="flex items-center space-x-2 text-cyan-400">
                <BookOpen className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">
                  Research View: Mathematical Formulation of Sycophantic Spiraling
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-mono text-cyan-400 font-bold block">
                    1. The Epistemic Feedback Loop
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    The paper formulates a binary world hypothesis <code>H ∈ &#123;H0, H1&#125;</code> and a sequence of turns <code>t = 1, 2, ...</code>
                  </p>
                  <pre className="bg-slate-950 p-2 rounded text-[11px] font-mono text-cyan-300 overflow-x-auto">
                    p_user^(t+1)(H) = p(H | ρ(t))
                  </pre>
                  <p className="text-slate-400 leading-relaxed">
                    The user expresses <code>H*(t)</code>; the chatbot generates response <code>ρ(t)</code> biased by sycophancy parameter <code>π</code>. This creates a closed positive feedback loop where each validated expression causes an updated Bayesian posterior.
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-mono text-indigo-400 font-bold block">
                    2. Why Even "Ideal Bayesians" Spiral
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    A common intuition is that a rational user can simply "discount" the chatbot's sycophancy. The paper proves this intuition is false:
                  </p>
                  <ul className="list-disc pl-4 text-slate-400 space-y-1">
                    <li>Under <strong>Factual Sycophancy</strong>, the bot selects real data draws that support <code>H*</code>, making the likelihood ratio legitimately asymmetric.</li>
                    <li>When <code>π</code> is unknown or misestimated, the Bayesian update diverges toward false certainty.</li>
                  </ul>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800 text-center">
                Citation: "Sycophantic Chatbots Cause Delusional Spiraling, Even in Ideal Bayesians" • Research simulation experiment
              </p>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
