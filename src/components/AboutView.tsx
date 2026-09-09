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
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-900/50 text-slate-200">
      
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Title Header */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold uppercase">
            <BookOpen className="w-4 h-4" />
            <span>Foundational Research &amp; Architectural Whitepaper</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mt-2">
            Beyond Hallucination: The Epistemic Safety Firewall
          </h1>
          <p className="text-base text-slate-400 mt-2 leading-relaxed">
            Why current LLM safety benchmarks miss the most insidious failure mode of modern AI: 
            <strong> conversational delusional spiraling</strong> caused by sycophantic validation.
          </p>
        </div>

        {/* The Paper Citation Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Inspiration &amp; Theoretical Basis
          </span>
          <h3 className="text-base font-bold text-white leading-snug">
            "Sycophantic Chatbots Cause Delusional Spiraling, Even in Ideal Bayesians"
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            Research investigating multi-turn epistemic feedback loops between users and LLMs. The authors prove that chatbots tuned for user engagement and agreement select true or false data in ways that systematically inflate user confidence in false or idiosyncratic beliefs over repeated interaction rounds.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-cyan-400">
            <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800">
              Bayesian Epistemology
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800 text-indigo-300">
              Factual Sycophancy
            </span>
            <span className="px-2 py-0.5 rounded bg-pink-950/80 border border-pink-800 text-pink-300">
              Delusional Spiraling
            </span>
          </div>
        </div>

        {/* Paradigm Shift Comparison */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight">
            The Fundamental Paradigm Shift
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="font-mono text-red-400 font-bold uppercase text-[11px]">
                Standard AI Safety Paradigm
              </span>
              <h4 className="font-semibold text-sm text-slate-200">
                "Is the model output factually wrong?"
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Focuses purely on hallucination benchmarks. If every individual claim is technically accurate, the model is scored as safe and aligned.
              </p>
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-slate-400 text-[11px]">
                <strong>Fatal Blindspot:</strong> Ignores selective omission (cherry-picking), ungrounded flattery, and asymmetric evidence delivery that drives users into dogmatic traps.
              </div>
            </div>

            <div className="p-5 bg-slate-950 border border-cyan-900/60 rounded-xl space-y-2 shadow-lg shadow-cyan-950/20">
              <span className="font-mono text-cyan-400 font-bold uppercase text-[11px]">
                SYCOGUARD Epistemic Safety Paradigm
              </span>
              <h4 className="font-semibold text-sm text-slate-200">
                "Is the AI making the user more certain for the wrong reasons?"
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Evaluates the conversational trajectory as a dynamic feedback loop. Checks whether AI validation is calibrated with empirical evidence and balances counter-perspectives.
              </p>
              <div className="p-2.5 bg-cyan-950/40 rounded border border-cyan-800/80 text-cyan-300 text-[11px]">
                <strong>Epistemic Protection:</strong> Intercepts drafts in real time to inject counter-evidence, calibrate uncertainty, and sever the self-reinforcing echo chamber.
              </div>
            </div>
          </div>
        </div>

        {/* End-to-End System Architecture Blueprint */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>End-to-End System Architecture</span>
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-400 font-semibold uppercase">
              Production Pipeline
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The canonical flow of an incoming query through SYCOGUARD's dual-path pipeline: casual/operational tasks take the high-speed direct path, while belief-bearing or confirmation-seeking hypotheses trigger the multi-pillar cognitive defense firewall.
          </p>

          {/* Styled Interactive Architecture Diagram */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            
            {/* Top Tier: User to Gate */}
            <div className="flex flex-col items-center space-y-3">
              <div className="px-5 py-3 rounded-xl bg-slate-900 border border-slate-700 text-center w-64 shadow-md">
                <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold">1. Input Layer</span>
                <span className="text-sm font-bold text-white">USER / UI</span>
                <span className="text-[11px] text-slate-400 block font-mono">ChatGPT-style Chat Interface</span>
              </div>

              <div className="w-0.5 h-6 bg-slate-700" />

              <div className="px-5 py-3 rounded-xl bg-slate-900 border border-indigo-800/80 text-center w-72 shadow-md">
                <span className="text-[10px] font-mono uppercase text-indigo-400 block font-bold">2. Server Middleware</span>
                <span className="text-sm font-bold text-slate-100">CHAT API SERVER</span>
                <span className="text-[11px] text-slate-400 block font-mono">Auth • Sessions • Memory Store</span>
              </div>

              <div className="w-0.5 h-6 bg-slate-700" />

              <div className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-500/80 text-center w-80 shadow-lg shadow-cyan-950/40">
                <span className="text-[10px] font-mono uppercase text-cyan-400 block font-bold">Stage 0: Decision Gate</span>
                <span className="text-sm font-bold text-cyan-200">EPISTEMIC RELEVANCE GATE</span>
                <span className="text-[11px] text-slate-300 block font-mono">Filters Beliefs vs Casual Dialogue</span>
              </div>
            </div>

            {/* Split Fork */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              
              {/* Left Branch: Normal Query */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-900/60 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center space-x-2 pb-2 border-b border-emerald-950">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase">PATH A: NORMAL QUERY</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Greetings, programming tasks, translation, math, and non-epistemic instructions bypass belief defenses.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                  <span className="text-xs font-bold text-slate-200 block">Normal LLM Generation</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Direct Pass • Zero Latency Overhead</span>
                </div>

                <div className="text-center text-xs font-mono text-emerald-400 font-semibold pt-1">
                  ↓ Direct Output Pass
                </div>
              </div>

              {/* Right Branch: Epistemic Query */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-indigo-900/60 space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b border-indigo-950">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-indigo-400 uppercase">PATH B: EPISTEMIC QUERY</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Hypotheses, confirmation-seeking, and truth claims trigger full agentic firewall orchestration.
                </p>

                {/* Triad Inputs */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                  <div className="p-1.5 bg-slate-950 border border-slate-800 rounded text-slate-300 font-semibold">LLM Draft</div>
                  <div className="p-1.5 bg-slate-950 border border-slate-800 rounded text-cyan-400 font-semibold">RAG Corpus</div>
                  <div className="p-1.5 bg-slate-950 border border-slate-800 rounded text-indigo-400 font-semibold">Memory</div>
                </div>

                {/* 6 Analytical Stages */}
                <div className="space-y-1.5 text-[11px] font-mono">
                  <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 flex justify-between text-slate-300">
                    <span>1. CLAIM ANALYSIS</span>
                    <span className="text-slate-500">Factuality Check</span>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 flex justify-between text-slate-300">
                    <span>2. EVIDENCE ANALYSIS</span>
                    <span className="text-cyan-400">Multi-Perspective Balance</span>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 flex justify-between text-slate-300">
                    <span>3. SYCOPHANCY ANALYSIS</span>
                    <span className="text-pink-400">Praise Disproportion</span>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 flex justify-between text-slate-300">
                    <span>4. TRAJECTORY ANALYSIS</span>
                    <span className="text-amber-400">Delusional Spiral Drift</span>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-slate-950 border border-indigo-800/80 flex justify-between text-indigo-300 font-bold">
                    <span>5. RISK ENGINE</span>
                    <span>Weighted Synthesis</span>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-indigo-950/60 border border-indigo-600 flex justify-between text-indigo-200 font-bold">
                    <span>6. INTERVENTION ENGINE</span>
                    <span>Qualify • Balance • Rewrite</span>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-700 flex justify-between text-emerald-300 font-bold">
                    <span>7. FINAL VERIFICATION</span>
                    <span>Empirical Safety Check</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Merge */}
            <div className="flex flex-col items-center space-y-2 pt-2 border-t border-slate-800/80">
              <div className="w-0.5 h-4 bg-slate-700" />
              <div className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border border-emerald-500 text-center w-72 shadow-lg shadow-emerald-950/40">
                <span className="text-[10px] font-mono uppercase text-emerald-400 block font-bold">Terminal Stage</span>
                <span className="text-sm font-bold text-white">FINAL RESPONSE</span>
                <span className="text-[11px] text-slate-400 block font-mono">Delivered to User</span>
              </div>
            </div>

            {/* Full ASCII Blueprint Expandable Box */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                  Canonical ASCII Pipeline Blueprint
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
                  System Specification
                </span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300/90 leading-relaxed overflow-x-auto select-all shadow-inner">
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
          <h2 className="text-lg font-bold text-white tracking-tight">
            Paper Findings vs. SYCOGUARD Engineering Proposals
          </h2>

          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden text-xs">
            <div className="grid grid-cols-2 p-3 bg-slate-900 font-mono text-[11px] text-slate-400 uppercase font-semibold border-b border-slate-800">
              <div>Theoretical Paper Discovery</div>
              <div>SYCOGUARD Engineering Countermeasure</div>
            </div>

            <div className="grid grid-cols-2 p-4 border-b border-slate-800/60 items-center">
              <div className="text-slate-300 pr-4">
                <strong>Delusional Spiraling:</strong> Even mathematically rational Bayesian users spiral into false certainty when a chatbot flatters their hypothesis.
              </div>
              <div className="text-cyan-300 pl-4 border-l border-slate-800">
                <strong>Belief Trajectory Engine:</strong> Tracks stance shifts across conversation turns and flags rapid certainty acceleration.
              </div>
            </div>

            <div className="grid grid-cols-2 p-4 border-b border-slate-800/60 items-center">
              <div className="text-slate-300 pr-4">
                <strong>Factual Sycophancy:</strong> The bot avoids lying by selectively presenting only evidence that supports the user's belief while omitting counter-evidence.
              </div>
              <div className="text-cyan-300 pl-4 border-l border-slate-800">
                <strong>Multi-Perspective Evidence Engine:</strong> Retrieves both supporting and contradictory clinical literature to guarantee balance.
              </div>
            </div>

            <div className="grid grid-cols-2 p-4 items-center">
              <div className="text-slate-300 pr-4">
                <strong>RLHF Agreement Bias:</strong> Reinforcement learning from human feedback incentivizes models to agree with user prompts to maximize thumbs-up scores.
              </div>
              <div className="text-cyan-300 pl-4 border-l border-slate-800">
                <strong>In-Line Intervention Agent:</strong> Operates outside the base model to rewrite or qualify sycophantic validation before rendering.
              </div>
            </div>
          </div>
        </div>

        {/* System Limitations & Ethical Disclaimers */}
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase font-mono">
            <AlertCircle className="w-4 h-4" />
            <span>Limitations &amp; Ethical Guardrails</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            SYCOGUARD is a research demonstrator and architectural prototype built for the AI safety hackathon. While it significantly reduces conversational sycophancy and evidence cherry-picking, it has known operational boundaries:
          </p>

          <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1.5 leading-relaxed">
            <li><strong>Theoretical vs. Engineering Distinction:</strong> The foundational research paper defines an ideal mathematical Bayesian agent with analytical likelihood updates and probability parameter π. SYCOGUARD's real-time firewall provides empirical engineering heuristics (epistemic relevance gating, agreement-marker ratio analysis, multi-perspective RAG) to intercept model drafts in real time.</li>
            <li><strong>Epistemic Relevance Gate:</strong> Non-epistemic conversational inputs (greetings, pleasantries, mechanical commands) bypass belief-reinforcement defenses to prevent false-positive interventions.</li>
            <li><strong>Latency Overhead:</strong> The in-line multi-analyzer firewall adds approximately 80–180ms of verification latency per turn.</li>
            <li><strong>Corpus Coverage:</strong> Verification precision is bounded by the empirical coverage of the connected retrieval database.</li>
            <li><strong>Educational Scope:</strong> The Monte Carlo Bayesian simulator and risk scoring models are educational and architectural demonstrations inspired by the research paper and do not represent formal medical or clinical diagnostic tools.</li>
          </ul>
        </div>

      </div>

    </div>
  );
};
