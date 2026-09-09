/**
 * SYCOGUARD Observability & Firewall Trace Panel
 * 
 * Inspects the exact agentic orchestration steps, execution latency,
 * and structured JSON payloads at each stage of the pipeline.
 * Also exposes configurable risk model weights.
 */

import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Code, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  RotateCcw,
  Sparkles,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';
import { FirewallTraceStep, RiskWeights } from '../types.js';

interface TraceViewProps {
  traceSteps?: FirewallTraceStep[];
  currentWeights: RiskWeights;
  onUpdateWeights: (weights: RiskWeights) => Promise<void>;
}

export const TraceView: React.FC<TraceViewProps> = ({
  traceSteps,
  currentWeights,
  onUpdateWeights
}) => {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [weights, setWeights] = useState<RiskWeights>(currentWeights);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showSampleFlow, setShowSampleFlow] = useState(false);

  useEffect(() => {
    setWeights(currentWeights);
  }, [currentWeights]);

  const toggleStep = (id: string) => {
    setExpandedStep(expandedStep === id ? null : id);
  };

  const handleSaveWeights = async () => {
    await onUpdateWeights(weights);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleResetWeights = () => {
    const defaultW: RiskWeights = {
      sycophancy: 0.30,
      hallucination: 0.25,
      evidenceImbalance: 0.20,
      reinforcement: 0.25
    };
    setWeights(defaultW);
    onUpdateWeights(defaultW);
  };

  const defaultSampleTrace: FirewallTraceStep[] = [
    {
      id: 'step_0_epistemic_gate',
      name: 'Epistemic Relevance Gate',
      status: 'completed',
      timestamp: Date.now() - 420,
      durationMs: 2,
      outputSummary: 'Relevant (CONFIRMATION_SEEKING): Explicit hypothesis and confirmation demand detected.',
      rawPayload: { isEpistemicallyRelevant: true, category: 'CONFIRMATION_SEEKING', confidence: 0.96 }
    },
    {
      id: 'step_1_hypothesis',
      name: 'Extract User Hypothesis & Stance',
      status: 'completed',
      timestamp: Date.now() - 400,
      durationMs: 14,
      outputSummary: 'Detected hypothesis: "caffeine permanently improves baseline memory" (Certainty: 90%)',
      rawPayload: { hypothesis: 'caffeine permanently improves baseline memory', certainty: 0.90 }
    },
    {
      id: 'step_2_llm_draft',
      name: 'Intercept Raw Model Draft',
      status: 'completed',
      timestamp: Date.now() - 380,
      durationMs: 180,
      outputSummary: 'Generated raw unconstrained response via gemini-3.8-flash. Intercepted before display.',
      rawPayload: { tokens: 74, explicitAgreement: true }
    },
    {
      id: 'step_3_rag',
      name: 'Retrieve Multi-Perspective Evidence',
      status: 'completed',
      timestamp: Date.now() - 200,
      durationMs: 22,
      outputSummary: 'Retrieved 4 empirical studies across psychopharmacology and Cochrane systematic reviews.',
      rawPayload: { retrievedCount: 4, counterStudies: 2 }
    },
    {
      id: 'step_4_claims_factuality',
      name: 'Atomic Claims & Factuality Verification',
      status: 'flagged',
      timestamp: Date.now() - 170,
      durationMs: 18,
      outputSummary: 'Extracted 2 atomic claims. 1 supported, 1 contradicted by receptor tolerance data.',
      rawPayload: { claimsCount: 2, contradicted: 1 }
    },
    {
      id: 'step_5_sycophancy',
      name: 'Sycophancy & Agreement Disproportion Analysis',
      status: 'flagged',
      timestamp: Date.now() - 150,
      durationMs: 16,
      outputSummary: 'Sycophancy Score: 88%. Validation strength was 90% against only 35% empirical evidence.',
      rawPayload: { score: 0.88, validationStrength: 0.90 }
    },
    {
      id: 'step_6_evidence_balance',
      name: 'Evidence Balance & Cherry-Picking Assessment',
      status: 'flagged',
      timestamp: Date.now() - 130,
      durationMs: 12,
      outputSummary: 'Evidence Balance: 25%. Two prominent contradictory studies were omitted in the raw draft.',
      rawPayload: { balanceScore: 0.25, omittedContradictory: 2 }
    },
    {
      id: 'step_7_trajectory',
      name: 'Belief Reinforcement Trajectory Analysis',
      status: 'flagged',
      timestamp: Date.now() - 110,
      durationMs: 8,
      outputSummary: 'Reinforcement Risk: 82%. User confirmed high stance escalation following repeated model validation.',
      rawPayload: { reinforcementRisk: 0.82, spiralAlert: true }
    },
    {
      id: 'step_8_risk',
      name: 'Composite Risk Engine',
      status: 'flagged',
      timestamp: Date.now() - 100,
      durationMs: 5,
      outputSummary: 'Composite Risk: 78% [CRITICAL]. Triggered high-risk intervention rewrite.',
      rawPayload: { overallScore: 0.78, level: 'CRITICAL' }
    },
    {
      id: 'step_9_intervention',
      name: 'Intervention Agent Execution',
      status: 'completed',
      timestamp: Date.now() - 80,
      durationMs: 45,
      outputSummary: 'Applied REWRITE intervention: Injected tolerance counter-evidence and qualified claims.',
      rawPayload: { action: 'REWRITE', applied: true }
    }
  ];

  const hasLiveTrace = Boolean(traceSteps && traceSteps.length > 0);
  const stepsToDisplay = hasLiveTrace ? traceSteps! : (showSampleFlow ? defaultSampleTrace : []);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-900/50 text-slate-200">
      
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-400 font-mono text-xs font-semibold uppercase">
                Observability &amp; Trace
              </span>
              <span className="text-xs font-mono text-slate-500">
                {hasLiveTrace ? 'Live Session Telemetry' : 'Standby Mode'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
              Firewall Pipeline Execution Trace
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Inspect each discrete decision, latency metric, and structured payload in the SYCOGUARD firewall architecture.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-slate-400">
              Stages: <strong>{stepsToDisplay.length}</strong>
            </span>
            {!hasLiveTrace && (
              <button
                onClick={() => setShowSampleFlow(!showSampleFlow)}
                className="px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-cyan-400 transition-colors"
              >
                {showSampleFlow ? 'Hide Sample Trace' : 'View Sample Telemetry Flow'}
              </button>
            )}
          </div>
        </div>

        {/* Configurable Risk Weights Box */}
        <div className="mt-6 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Configurable Epistemic Risk Weights</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                risk = w1 * sycophancy + w2 * hallucination + w3 * evidenceImbalance + w4 * reinforcement
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleResetWeights}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-md flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
              <button
                onClick={handleSaveWeights}
                className="px-3 py-1 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-md flex items-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savedSuccess ? 'Saved!' : 'Save Weights'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono">
                <span>w1: Sycophancy</span>
                <span className="text-cyan-400 font-bold">{weights.sycophancy.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={weights.sycophancy}
                onChange={(e) => setWeights({ ...weights, sycophancy: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-mono">
                <span>w2: Hallucination</span>
                <span className="text-emerald-400 font-bold">{weights.hallucination.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={weights.hallucination}
                onChange={(e) => setWeights({ ...weights, hallucination: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-mono">
                <span>w3: Evidence Imbalance</span>
                <span className="text-indigo-400 font-bold">{weights.evidenceImbalance.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={weights.evidenceImbalance}
                onChange={(e) => setWeights({ ...weights, evidenceImbalance: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-mono">
                <span>w4: Reinforcement</span>
                <span className="text-pink-400 font-bold">{weights.reinforcement.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={weights.reinforcement}
                onChange={(e) => setWeights({ ...weights, reinforcement: parseFloat(e.target.value) })}
                className="w-full accent-pink-500"
              />
            </div>

          </div>
          <p className="text-[10px] font-mono text-slate-500 text-right">
            Prototype risk model — configurable safety weighting
          </p>
        </div>

        {/* Step-by-Step Trace Timeline */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Pipeline Execution Steps
            </h3>
            {hasLiveTrace ? (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Session Telemetry</span>
              </span>
            ) : (
              <span className="text-[11px] font-mono text-slate-500">
                {showSampleFlow ? 'Viewing Sample Flow' : 'Awaiting Live Execution'}
              </span>
            )}
          </div>

          {!hasLiveTrace && !showSampleFlow ? (
            <div className="p-8 text-center bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
              <Layers className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-300">
                No Execution Trace Available
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Send a message in the <strong>Live Firewall</strong> chat or execute a benchmark in <strong>Benchmark Lab</strong> to record and inspect real-time agentic execution steps.
              </p>
              <button
                onClick={() => setShowSampleFlow(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400 text-xs font-mono hover:bg-slate-800 transition-colors"
              >
                <span>View Sample Architectural Flow</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            stepsToDisplay.map((step, idx) => {
              const isExpanded = expandedStep === step.id;
              const isFlagged = step.status === 'flagged';
              const isSkipped = step.status === 'skipped';

              return (
                <div
                  key={step.id}
                  className={`bg-slate-950 border rounded-xl overflow-hidden transition-all ${
                    isFlagged 
                      ? 'border-amber-900/60' 
                      : isSkipped 
                        ? 'border-slate-800/60 opacity-85' 
                        : 'border-slate-800'
                  }`}
                >
                  {/* Header Row */}
                  <div
                    onClick={() => toggleStep(step.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/40 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800 font-mono text-xs flex items-center justify-center text-slate-400">
                        {idx}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-semibold text-slate-200">
                            {step.name}
                          </h4>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase ${
                            isFlagged 
                              ? 'bg-amber-950/80 text-amber-400 border border-amber-800' 
                              : isSkipped 
                                ? 'bg-slate-800 text-slate-400 border border-slate-700' 
                                : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                          }`}>
                            {step.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {step.outputSummary}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="hidden sm:flex items-center space-x-1 text-[11px] font-mono text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{step.durationMs}ms</span>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded JSON Payload */}
                  {isExpanded && step.rawPayload && (
                    <div className="border-t border-slate-800/80 p-4 bg-slate-950 text-xs font-mono">
                      <div className="flex items-center justify-between mb-2 text-slate-400">
                        <div className="flex items-center space-x-1">
                          <Code className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Structured Stage Payload</span>
                        </div>
                        <span>Stage ID: {step.id}</span>
                      </div>
                      <pre className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg text-slate-300 overflow-x-auto text-[11px]">
                        {JSON.stringify(step.rawPayload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
