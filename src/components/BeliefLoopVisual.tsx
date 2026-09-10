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
    <div className="glass-panel rounded-2xl p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Epistemic Mechanism Visualizer
          </h4>
          <h3 className="text-sm font-semibold text-zinc-100">
            Conversational Belief Reinforcement Loop
          </h3>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.05] text-zinc-300 border border-white/10">
            Paper-Modeled Feedback Loop
          </span>
        </div>
      </div>

      {/* Cyclic Nodes Layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative py-2">
        
        {/* Node 1: User Expresses Hypothesis */}
        <div className="glass-card rounded-xl p-3.5 relative flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[10px] font-mono text-zinc-400">1. PRIOR STANCE</span>
            <User className="w-3.5 h-3.5 text-zinc-300" />
          </div>
          <div className="font-medium text-xs text-zinc-200">User Expresses Hypothesis H*(t)</div>
          <div className="mt-2 text-[11px] font-mono text-zinc-400">
            p(H) ≈ {(userStance * 100).toFixed(0)}%
          </div>
        </div>

        {/* Node 2: Chatbot Validation */}
        <div className={`glass-card rounded-xl p-3.5 relative flex flex-col justify-between transition-colors ${
          isHighRisk ? 'border-amber-500/40 bg-amber-500/10' : ''
        }`}>
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[10px] font-mono text-zinc-400">2. RAW RESPONSE</span>
            <MessageSquare className={`w-3.5 h-3.5 ${isHighRisk ? 'text-amber-400' : 'text-zinc-400'}`} />
          </div>
          <div className="font-medium text-xs text-zinc-200">Chatbot Responds ρ(t)</div>
          <div className={`mt-2 text-[11px] font-mono ${isHighRisk ? 'text-amber-400 font-semibold' : 'text-zinc-400'}`}>
            Validation π̂ ≈ {(aiValidation * 100).toFixed(0)}%
          </div>
        </div>

        {/* Node 3: Bayesian Update */}
        <div className="glass-card rounded-xl p-3.5 relative flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[10px] font-mono text-zinc-400">3. BELIEF UPDATE</span>
            <TrendingUp className="w-3.5 h-3.5 text-zinc-300" />
          </div>
          <div className="font-medium text-xs text-zinc-200">User Increases Certainty</div>
          <div className="mt-2 text-[11px] font-mono text-zinc-400">
            p_user^(t+1) = p(H|ρ) ↑
          </div>
        </div>

        {/* Node 4: Reinforced Expression */}
        <div className="glass-card rounded-xl p-3.5 relative flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[10px] font-mono text-zinc-400">4. NEXT TURN</span>
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
          </div>
          <div className="font-medium text-xs text-zinc-200">Escalated Dogmatism</div>
          <div className="mt-2 text-[11px] font-mono text-zinc-400">
            Feedback Loop Repeats
          </div>
        </div>

      </div>

      {/* Firewall Intervention Barrier */}
      <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          {interventionApplied ? (
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
              <span>LOOP SEVERED: SYCOGUARD Intervention Applied</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-zinc-400 text-xs px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700">
              <ShieldAlert className="w-4 h-4 text-zinc-300" />
              <span>Firewall Monitoring: In-line Evidence Verification Active</span>
            </div>
          )}
        </div>

        <p className="text-[10px] text-zinc-500 font-mono text-center sm:text-right">
          Conceptual visualization of paper-modeled belief spiraling • Not a medical diagnostic
        </p>
      </div>
    </div>
  );
};
