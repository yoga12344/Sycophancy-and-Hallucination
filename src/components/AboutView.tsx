/**
 * SYCOGUARD Research Paper & Epistemic Safety Foundations
 * 
 * Deep-dive educational view citing:
 * "Sycophantic Chatbots Cause Delusional Spiraling, Even in Ideal Bayesians"
 */

import React from 'react';
import { 
  FileText, 
  BookOpen, 
  ShieldCheck, 
  ExternalLink, 
  AlertCircle, 
  Layers, 
  CheckCircle2,
  Cpu
} from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-transparent text-zinc-200">
      
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Title Header */}
        <div className="border-b border-white/[0.08] pb-6">
          <div className="flex items-center space-x-2 text-zinc-400 font-mono text-xs font-semibold uppercase">
            <BookOpen className="w-4 h-4" />
            <span>Foundational Research &amp; Architectural Whitepaper</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight mt-2">
            Beyond Hallucination: The Epistemic Safety Firewall
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 mt-2 leading-relaxed">
            Why current LLM safety benchmarks miss the most insidious failure mode of modern AI: 
            <strong className="text-zinc-200"> conversational delusional spiraling</strong> caused by sycophantic validation.
          </p>
        </div>

        {/* The Paper Citation Box */}
        <div className="glass-panel rounded-2xl p-6 shadow-md space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            Inspiration &amp; Theoretical Basis
          </span>
          <h3 className="text-sm sm:text-base font-bold text-zinc-100 leading-snug">
            "Sycophantic Chatbots Cause Delusional Spiraling, Even in Ideal Bayesians"
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed font-mono">
            Research investigating multi-turn epistemic feedback loops between users and LLMs. The authors prove that chatbots tuned for user engagement and agreement select true or false data in ways that systematically inflate user confidence in false or idiosyncratic beliefs over repeated interaction rounds.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono">
            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-zinc-300">
              Bayesian Epistemology
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-zinc-300">
              Factual Sycophancy
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-zinc-300">
              Delusional Spiraling
            </span>
          </div>
        </div>

        {/* Paradigm Shift Comparison */}
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
            The Fundamental Paradigm Shift
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 glass-card rounded-2xl space-y-2 border-rose-500/25">
              <span className="font-mono text-rose-400 font-semibold uppercase text-[11px]">
                Standard AI Safety Paradigm
              </span>
              <h4 className="font-medium text-sm text-zinc-200">
                "Is the model output factually wrong?"
              </h4>
              <p className="text-zinc-400 leading-relaxed">
                Focuses purely on hallucination benchmarks. If every individual claim is technically accurate, the model is scored as safe and aligned.
              </p>
              <div className="p-3 glass-panel-subtle rounded-xl border border-white/[0.06] text-zinc-400 text-[11px]">
                <strong className="text-zinc-300">Fatal Blindspot:</strong> Ignores selective omission (cherry-picking), ungrounded flattery, and asymmetric evidence delivery that drives users into dogmatic traps.
              </div>
            </div>

            <div className="p-5 glass-card rounded-2xl space-y-2 border-emerald-500/25 shadow-sm">
              <span className="font-mono text-emerald-400 font-semibold uppercase text-[11px]">
                SYCOGUARD Epistemic Safety Paradigm
              </span>
              <h4 className="font-medium text-sm text-zinc-200">
                "Is the AI making the user more certain for the wrong reasons?"
              </h4>
              <p className="text-zinc-400 leading-relaxed">
                Evaluates the conversational trajectory as a dynamic feedback loop. Checks whether AI validation is calibrated with empirical evidence and balances counter-perspectives.
              </p>
              <div className="p-3 glass-panel-subtle rounded-xl border border-white/[0.06] text-zinc-300 text-[11px]">
                <strong className="text-emerald-400">Epistemic Protection:</strong> Intercepts drafts in real time to inject counter-evidence, calibrate uncertainty, and sever the self-reinforcing echo chamber.
              </div>
            </div>
          </div>
        </div>

        {/* End-to-End System Architecture Blueprint */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight flex items-center space-x-2">
              <Layers className="w-4 h-4 text-zinc-400" />
              <span>End-to-End System Architecture</span>
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-400 font-medium uppercase">
              Production Pipeline
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            The canonical flow of an incoming query through SYCOGUARD's dual-path pipeline: casual/operational tasks take the high-speed direct path, while belief-bearing or confirmation-seeking hypotheses trigger the multi-pillar cognitive defense firewall.
          </p>

          {/* Styled Interactive Architecture Diagram */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
            
            {/* Top Tier: User to Gate */}
            <div className="flex flex-col items-center space-y-3">
              <div className="px-5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center w-64 shadow-xs">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block font-bold">1. Input Layer</span>
                <span className="text-sm font-bold text-zinc-100">USER / UI</span>
                <span className="text-[11px] text-zinc-400 block font-mono">ChatGPT-style Chat Interface</span>
              </div>

              <div className="w-0.5 h-6 bg-zinc-800" />

              <div className="px-5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center w-72 shadow-xs">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">2. Server Middleware</span>
                <span className="text-sm font-bold text-zinc-100">CHAT API SERVER</span>
                <span className="text-[11px] text-zinc-400 block font-mono">Auth • Sessions • Memory Store</span>
              </div>

              <div className="w-0.5 h-6 bg-zinc-800" />

              <div className="px-6 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-center w-80 shadow-xs">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">Stage 0: Decision Gate</span>
                <span className="text-sm font-bold text-zinc-100">EPISTEMIC RELEVANCE GATE</span>
                <span className="text-[11px] text-zinc-400 block font-mono">Filters Beliefs vs Casual Dialogue</span>
              </div>
            </div>

            {/* Split Fork */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              
              {/* Left Branch: Normal Query */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center space-x-2 pb-2 border-b border-zinc-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-mono font-medium text-emerald-400 uppercase">PATH A: NORMAL QUERY</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2">
                    Greetings, programming tasks, translation, math, and non-epistemic instructions bypass belief defenses.
                  </p>
                </div>

                <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 text-center">
                  <span className="text-xs font-medium text-zinc-200 block">Normal LLM Generation</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Direct Pass • Zero Latency Overhead</span>
                </div>

                <div className="text-center text-xs font-mono text-emerald-400 font-semibold pt-1">
                  ↓ Direct Output Pass
                </div>
              </div>

              {/* Right Branch: Epistemic Query */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b border-zinc-800">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-mono font-medium text-amber-400 uppercase">PATH B: EPISTEMIC QUERY</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Hypotheses, confirmation-seeking, and truth claims trigger full agentic firewall orchestration.
                </p>

                {/* Triad Inputs */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                  <div className="p-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 font-medium">LLM Draft</div>
                  <div className="p-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 font-medium">RAG Corpus</div>
                  <div className="p-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 font-medium">Memory</div>
                </div>

                {/* 6 Analytical Stages */}
                <div className="space-y-1.5 text-[11px] font-mono">
                  <div className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800/80 flex justify-between text-zinc-300">
                    <span>1. CLAIM ANALYSIS</span>
                    <span className="text-zinc-500">Factuality Check</span>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800/80 flex justify-between text-zinc-300">
                    <span>2. EVIDENCE ANALYSIS</span>
                    <span className="text-zinc-400">Multi-Perspective Balance</span>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800/80 flex justify-between text-zinc-300">
                    <span>3. SYCOPHANCY ANALYSIS</span>
                    <span className="text-zinc-400">Praise Disproportion</span>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800/80 flex justify-between text-zinc-300">
                    <span>4. TRAJECTORY ANALYSIS</span>
                    <span className="text-zinc-400">Delusional Spiral Drift</span>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800/80 flex justify-between text-zinc-200 font-medium">
                    <span>5. RISK ENGINE</span>
                    <span className="text-zinc-400">Weighted Synthesis</span>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 flex justify-between text-amber-400 font-medium">
                    <span>6. INTERVENTION ENGINE</span>
                    <span>Qualify • Balance • Rewrite</span>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 flex justify-between text-emerald-400 font-medium">
                    <span>7. FINAL VERIFICATION</span>
                    <span>Empirical Safety Check</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Merge */}
            <div className="flex flex-col items-center space-y-2 pt-2 border-t border-zinc-800">
              <div className="w-0.5 h-4 bg-zinc-800" />
              <div className="px-6 py-2.5 rounded-xl bg-zinc-950 border border-emerald-500/30 text-center w-72 shadow-xs">
                <span className="text-[10px] font-mono uppercase text-emerald-400 block font-medium">Terminal Stage</span>
                <span className="text-sm font-semibold text-zinc-100">FINAL RESPONSE</span>
                <span className="text-[11px] text-zinc-400 block font-mono">Delivered to User</span>
              </div>
            </div>

            {/* Full ASCII Blueprint Expandable Box */}
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">
                  Canonical ASCII Pipeline Blueprint
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded">
                  System Specification
                </span>
              </div>
              <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 leading-relaxed overflow-x-auto select-all shadow-inner">
{`                         ┌──────────────────────┐
                         │      USER / UI       │
                         │ ChatGPT-style Chat   │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   CHAT API SERVER    │
                         │ Auth / Sessions      │
                         │ Conversation Memory  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                       ┌────────────────────────┐
                       │ EPISTEMIC RELEVANCE    │
                       │         GATE            │
                       └───────────┬────────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  │                                 │
             NORMAL QUERY                     EPISTEMIC QUERY
                  │                                 │
                  ▼                                 ▼
          ┌──────────────┐                ┌──────────────────┐
          │ Normal LLM   │                │ AGENTIC          │
          │ Generation   │                │ ORCHESTRATOR     │
          └──────┬───────┘                └────────┬─────────┘
                 │                                 │
                 │                  ┌──────────────┼──────────────┐
                 │                  ▼              ▼              ▼
                 │                LLM            RAG          MEMORY
                 │                  │              │              │
                 │                  └──────────────┼──────────────┘
                 │                                 ▼
                 │                         CLAIM ANALYSIS
                 │                                 │
                 │                                 ▼
                 │                         EVIDENCE ANALYSIS
                 │                                 │
                 │                                 ▼
                 │                         SYCOPHANCY ANALYSIS
                 │                                 │
                 │                                 ▼
                 │                       TRAJECTORY ANALYSIS
                 │                                 │
                 │                                 ▼
                 │                           RISK ENGINE
                 │                                 │
                 │                                 ▼
                 │                        INTERVENTION ENGINE
                 │                                 │
                 │                                 ▼
                 │                         FINAL VERIFICATION
                 │                                 │
                 └────────────────┬────────────────┘
                                  ▼
                         ┌──────────────────┐
                         │ FINAL RESPONSE   │
                         └────────┬─────────┘
                                  ▼
                                USER`}
              </pre>
            </div>

          </div>
        </div>

        {/* Paper Findings vs SYCOGUARD Engineering Proposals */}
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
            Paper Findings vs. SYCOGUARD Engineering Proposals
          </h2>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden text-xs">
            <div className="grid grid-cols-2 p-3 bg-zinc-950 font-mono text-[11px] text-zinc-400 uppercase font-semibold border-b border-zinc-800">
              <div>Theoretical Paper Discovery</div>
              <div>SYCOGUARD Engineering Countermeasure</div>
            </div>

            <div className="grid grid-cols-2 p-4 border-b border-zinc-800/60 items-center">
              <div className="text-zinc-300 pr-4">
                <strong className="text-zinc-100">Delusional Spiraling:</strong> Even mathematically rational Bayesian users spiral into false certainty when a chatbot flatters their hypothesis.
              </div>
              <div className="text-zinc-300 pl-4 border-l border-zinc-800">
                <strong className="text-emerald-400">Belief Trajectory Engine:</strong> Tracks stance shifts across conversation turns and flags rapid certainty acceleration.
              </div>
            </div>

            <div className="grid grid-cols-2 p-4 border-b border-zinc-800/60 items-center">
              <div className="text-zinc-300 pr-4">
                <strong className="text-zinc-100">Factual Sycophancy:</strong> The bot avoids lying by selectively presenting only evidence that supports the user's belief while omitting counter-evidence.
              </div>
              <div className="text-zinc-300 pl-4 border-l border-zinc-800">
                <strong className="text-emerald-400">Multi-Perspective Evidence Engine:</strong> Retrieves both supporting and contradictory clinical literature to guarantee balance.
              </div>
            </div>

            <div className="grid grid-cols-2 p-4 items-center">
              <div className="text-zinc-300 pr-4">
                <strong className="text-zinc-100">RLHF Agreement Bias:</strong> Reinforcement learning from human feedback incentivizes models to agree with user prompts to maximize thumbs-up scores.
              </div>
              <div className="text-zinc-300 pl-4 border-l border-zinc-800">
                <strong className="text-emerald-400">In-Line Intervention Agent:</strong> Operates outside the base model to rewrite or qualify sycophantic validation before rendering.
              </div>
            </div>
          </div>
        </div>

        {/* System Limitations & Ethical Disclaimers */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase font-mono">
            <AlertCircle className="w-4 h-4" />
            <span>Limitations &amp; Ethical Guardrails</span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            SYCOGUARD is a research demonstrator and architectural prototype built for the AI safety hackathon. While it significantly reduces conversational sycophancy and evidence cherry-picking, it has known operational boundaries:
          </p>

          <ul className="list-disc pl-5 text-xs text-zinc-400 space-y-1.5 leading-relaxed">
            <li><strong className="text-zinc-300">Theoretical vs. Engineering Distinction:</strong> The foundational research paper defines an ideal mathematical Bayesian agent with analytical likelihood updates and probability parameter π. SYCOGUARD's real-time firewall provides empirical engineering heuristics (epistemic relevance gating, agreement-marker ratio analysis, multi-perspective RAG) to intercept model drafts in real time.</li>
            <li><strong className="text-zinc-300">Epistemic Relevance Gate:</strong> Non-epistemic conversational inputs (greetings, pleasantries, mechanical commands) bypass belief-reinforcement defenses to prevent false-positive interventions.</li>
            <li><strong className="text-zinc-300">Latency Overhead:</strong> The in-line multi-analyzer firewall adds approximately 80–180ms of verification latency per turn.</li>
            <li><strong className="text-zinc-300">Corpus Coverage:</strong> Verification precision is bounded by the empirical coverage of the connected retrieval database.</li>
            <li><strong className="text-zinc-300">Educational Scope:</strong> The Monte Carlo Bayesian simulator and risk scoring models are educational and architectural demonstrations inspired by the research paper and do not represent formal medical or clinical diagnostic tools.</li>
          </ul>
        </div>

      </div>

    </div>
  );
};
