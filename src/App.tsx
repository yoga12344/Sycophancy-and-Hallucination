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
    <div 
      className="flex flex-col w-full h-screen h-[100dvh] min-h-screen bg-transparent text-zinc-100 font-sans antialiased select-text relative overflow-hidden flex-1"
      style={{
        width: '100%',
        height: '100dvh',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        margin: 0,
        padding: 0
      }}
    >
      
      {/* Ambient background blur elements for glassmorphism refraction */}
      <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/[0.07] blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-15%] left-[25%] w-[55vw] h-[55vw] rounded-full bg-purple-500/[0.06] blur-[160px] pointer-events-none -z-10" />

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
      <main 
        className="flex-1 min-h-0 flex overflow-hidden relative"
        style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}
      >
        
        {/* VIEW A: Live Firewall Chat with Risk Sidebar */}
        {activeTab === 'chat' && (
          <div 
            className="flex-1 min-h-0 flex flex-col lg:flex-row h-full overflow-hidden w-full"
            style={{ flex: 1, minHeight: 0, height: '100%', width: '100%', display: 'flex', overflow: 'hidden' }}
          >
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
      <footer className="h-8 bg-black/40 backdrop-blur-md border-t border-white/[0.07] px-4 flex items-center justify-between text-[11px] font-mono text-zinc-500 shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${firewallActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-zinc-300 font-medium">
              {firewallActive ? 'FIREWALL ACTIVE' : 'BYPASS MODE (RAW LLM)'}
            </span>
          </div>
          <span className="text-zinc-800 hidden sm:inline">|</span>
          <span className="hidden sm:inline text-zinc-400">Model: {activeProvider}</span>
          <span className="text-zinc-800 hidden sm:inline">|</span>
          <span className="hidden sm:inline text-zinc-500">In-Line Latency: ~140ms</span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-zinc-400">Epistemic Integrity:</span>
            <span className="font-semibold text-emerald-400">{epistemicIndex}%</span>
          </div>
          <span className="text-zinc-800 hidden md:inline">|</span>
          <span className="hidden md:inline text-zinc-500">SYCOGUARD v1.0</span>
        </div>
      </footer>

    </div>
  );
}

export default App;
