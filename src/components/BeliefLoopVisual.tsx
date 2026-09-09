/**
 * SYCOGUARD Killer Visual: The Belief Reinforcement Loop
 * 
 * Visually displays the cyclical feedback loop modeled in:
 * "Sycophantic Chatbots Cause Delusional Spiraling, Even in Ideal Bayesians"
 * 
 * Shows how SYCOGUARD's intervention agent severs the self-reinforcing echo chamber.
 */

import React from 'react';
import { User, MessageSquare, TrendingUp, Sparkles, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import { RiskLevel } from '../types.js';

interface BeliefLoopVisualProps {
  riskLevel: RiskLevel;
  interventionApplied: boolean;
  userStance?: number;
  aiValidation?: number;
}

export const BeliefLoopVisual: React.FC<BeliefLoopVisualProps> = ({
  riskLevel,
  interventionApplied,
  userStance = 0.75,
  aiValidation = 0.82
}) => {
  const isHighRisk = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-lg relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
        isHighRisk ? 'bg-red-500' : 'bg-cyan-500'
      }`} />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Epistemic Mechanism Visualizer
          </h4>
          <h3 className="text-sm font-semibold text-slate-200">
            Conversational Belief Reinforcement Loop
          </h3>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Paper-Modeled Feedback Loop
          </span>
        </div>
      </div>

      {/* Cyclic Nodes Layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative py-2">
        
        {/* Node 1: User Expresses Hypothesis */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 relative flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono">1. PRIOR STANCE</span>
            <User className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-semibold text-xs text-slate-200">User Expresses Hypothesis H*(t)</div>
          <div className="mt-2 text-[11px] font-mono text-cyan-400/90">
            p(H) ≈ {(userStance * 100).toFixed(0)}%
          </div>
        </div>

        {/* Node 2: Chatbot Validation */}
        <div className={`bg-slate-950/80 border rounded-lg p-3 relative flex flex-col justify-between transition-colors ${
          isHighRisk ? 'border-amber-500/50 bg-amber-950/20' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono">2. RAW RESPONSE</span>
            <MessageSquare className={`w-4 h-4 ${isHighRisk ? 'text-amber-400' : 'text-slate-400'}`} />
          </div>
          <div className="font-semibold text-xs text-slate-200">Chatbot Responds ρ(t)</div>
          <div className="mt-2 text-[11px] font-mono text-amber-400/90">
            Validation π̂ ≈ {(aiValidation * 100).toFixed(0)}%
          </div>
        </div>

        {/* Node 3: Bayesian Update */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 relative flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono">3. BELIEF UPDATE</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="font-semibold text-xs text-slate-200">User Increases Certainty</div>
          <div className="mt-2 text-[11px] font-mono text-indigo-400/90">
            p_user^(t+1) = p(H|ρ) ↑
          </div>
        </div>

        {/* Node 4: Reinforced Expression */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 relative flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono">4. NEXT TURN</span>
            <Sparkles className="w-4 h-4 text-pink-400" />
          </div>
          <div className="font-semibold text-xs text-slate-200">Escalated Dogmatism</div>
          <div className="mt-2 text-[11px] font-mono text-pink-400/90">
            Feedback Loop Repeats
          </div>
        </div>

      </div>

      {/* Firewall Intervention Barrier */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          {interventionApplied ? (
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded bg-emerald-950/70 border border-emerald-800/80">
              <ShieldCheck className="w-4 h-4" />
              <span>LOOP SEVERED: SYCOGUARD Intervention Applied</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-slate-400 text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>Firewall Monitoring: In-line Evidence Verification Active</span>
            </div>
          )}
        </div>

        <p className="text-[10px] text-slate-500 font-mono text-center sm:text-right">
          Conceptual visualization of paper-modeled belief spiraling • Not a medical diagnostic
        </p>
      </div>
    </div>
  );
};
