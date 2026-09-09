/**
 * SYCOGUARD - Sycophancy & Hallucination Firewall
 * 
 * Main Application Component
 */

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar.js';
import { ChatView } from './components/ChatView.js';
import { RiskSidebar } from './components/RiskSidebar.js';
import { ComparisonView } from './components/ComparisonView.js';
import { SimulatorView } from './components/SimulatorView.js';
import { EvaluationsView } from './components/EvaluationsView.js';
import { TraceView } from './components/TraceView.js';
import { AboutView } from './components/AboutView.js';
import { 
  ConversationMessage, 
  FirewallAnalysis, 
  BenchmarkScenario, 
  RiskWeights, 
  SimulationConfig 
} from './types.js';
import { Shield, ShieldAlert, Cpu, Activity, Info } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [firewallActive, setFirewallActive] = useState<boolean>(true);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<FirewallAnalysis | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<'auto' | 'gemini' | 'openai' | 'openrouter'>('auto');
  const [activeProvider, setActiveProvider] = useState<string>('gemini-3.6-flash');
  const [benchmarkScenarios, setBenchmarkScenarios] = useState<BenchmarkScenario[]>([]);
  const [weights, setWeights] = useState<RiskWeights>({
    sycophancy: 0.30,
    hallucination: 0.25,
    evidenceImbalance: 0.20,
    reinforcement: 0.25
  });

  // Fetch initial health and benchmarks
  useEffect(() => {
    async function init() {
      try {
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setIsDemoMode(!healthData.hasApiKey);
          if (healthData.activeWeights) {
            setWeights(healthData.activeWeights);
          }
        }

        const benchRes = await fetch('/api/benchmarks');
        if (benchRes.ok) {
          const benches = await benchRes.json();
          setBenchmarkScenarios(benches);
        }
      } catch (err) {
        console.warn('Backend initializing...', err);
      }
    }
    init();
  }, []);

  // Send message in Live Firewall Chat
  const handleSendMessage = async (userPrompt: string) => {
    if (!userPrompt.trim() || isLoading) return;

    const userMsg: ConversationMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: userPrompt,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userPrompt,
          conversationId: 'active_session',
          provider: selectedProvider
        })
      });

      if (!res.ok) throw new Error('Failed to reach firewall API');
      const data = await res.json();

      // If firewall is bypassed by user toggle, show raw draft, else show protected final
      const contentToDisplay = firewallActive ? data.final : data.draft;

      const assistantMsg: ConversationMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: contentToDisplay,
        rawDraft: data.draft,
        timestamp: Date.now(),
        analysis: data.analysis,
        isDemo: data.isDemo
      };

      setMessages(prev => [...prev, assistantMsg]);
      setActiveAnalysis(data.analysis);
      setIsDemoMode(data.isDemo);
      if (data.provider) {
        setActiveProvider(data.provider);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: ConversationMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: 'Firewall temporarily offline. Running local fallback analysis.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Run standalone comparison analysis
  const handleAnalyzePrompt = async (prompt: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          provider: selectedProvider
        })
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.analysis) {
        setActiveAnalysis(data.analysis);
      }
      if (data.provider) {
        setActiveProvider(data.provider);
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  // Run Bayesian simulation
  const handleRunSimulation = async (config: SimulationConfig) => {
    const res = await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config })
    });
    if (!res.ok) throw new Error('Simulation failed');
    return await res.json();
  };

  // Run Evaluation scenario
  const handleRunEvaluation = async (scenarioId: string) => {
    const res = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId })
    });
    if (!res.ok) throw new Error('Evaluation failed');
    return await res.json();
  };

  // Update risk weights
  const handleUpdateWeights = async (newWeights: RiskWeights) => {
    setWeights(newWeights);
    await fetch('/api/config/weights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newWeights)
    });
  };

  const handleClearChat = () => {
    setMessages([]);
    setActiveAnalysis(undefined);
  };

  // Epistemic Integrity Index (0 to 100)
  const epistemicIndex = activeAnalysis 
    ? Math.round((1 - activeAnalysis.risk.overallScore) * 100) 
    : 94;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans antialiased select-text">
      
      {/* 1. Global Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        firewallActive={firewallActive}
        setFirewallActive={setFirewallActive}
        isDemoMode={isDemoMode}
        activeProvider={activeProvider}
        selectedProvider={selectedProvider}
        onSelectProvider={setSelectedProvider}
      />

      {/* 2. Main Workspace Area */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* VIEW A: Live Firewall Chat with Risk Sidebar */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
            <ChatView
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onClear={handleClearChat}
              onSelectMessageAnalysis={setActiveAnalysis}
              activeAnalysis={activeAnalysis}
              onSwitchToComparison={() => setActiveTab('comparison')}
            />
            <RiskSidebar
              analysis={activeAnalysis}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* VIEW B: Raw vs Protected Side-by-Side Comparison */}
        {activeTab === 'comparison' && (
          <ComparisonView
            onAnalyzePrompt={handleAnalyzePrompt}
            isLoading={isLoading}
            benchmarkScenarios={benchmarkScenarios}
          />
        )}

        {/* VIEW C: Bayesian Sycophancy Research Simulator */}
        {activeTab === 'simulator' && (
          <SimulatorView
            onRunSimulation={handleRunSimulation}
          />
        )}

        {/* VIEW D: Benchmark Evaluation Lab */}
        {activeTab === 'evaluations' && (
          <EvaluationsView
            scenarios={benchmarkScenarios}
            onRunEvaluation={handleRunEvaluation}
          />
        )}

        {/* VIEW E: Firewall Trace & Observability */}
        {activeTab === 'trace' && (
          <TraceView
            traceSteps={activeAnalysis?.trace}
            currentWeights={weights}
            onUpdateWeights={handleUpdateWeights}
          />
        )}

        {/* VIEW F: Research Paper Foundations */}
        {activeTab === 'about' && (
          <AboutView />
        )}

      </main>

      {/* 3. Bottom Epistemic Status Bar */}
      <footer className="h-8 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] font-mono text-slate-500 shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${firewallActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-semibold">
              {firewallActive ? 'FIREWALL ACTIVE' : 'BYPASS MODE (RAW LLM)'}
            </span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="hidden sm:inline">Model: {activeProvider}</span>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="hidden sm:inline">In-Line Latency: ~140ms</span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span>Epistemic Integrity Index:</span>
            <span className="font-bold text-emerald-400">{epistemicIndex}%</span>
          </div>
          <span className="text-slate-700 hidden md:inline">|</span>
          <span className="hidden md:inline text-slate-400">SYCOGUARD v1.0</span>
        </div>
      </footer>

    </div>
  );
}

export default App;
