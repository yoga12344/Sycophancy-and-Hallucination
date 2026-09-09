/**
 * SYCOGUARD Top Navigation Bar
 */

import React from 'react';
import { Shield, Activity, Cpu, Sparkles, Sliders, FileText, SplitSquareVertical } from 'lucide-react';

export type ActiveTab = 'chat' | 'comparison' | 'simulator' | 'evaluations' | 'trace' | 'about';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  firewallActive: boolean;
  setFirewallActive: (active: boolean) => void;
  isDemoMode: boolean;
  activeProvider?: string;
  selectedProvider?: 'auto' | 'gemini' | 'openai' | 'openrouter';
  onSelectProvider?: (provider: 'auto' | 'gemini' | 'openai' | 'openrouter') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  firewallActive,
  setFirewallActive,
  isDemoMode,
  activeProvider,
  selectedProvider = 'auto',
  onSelectProvider
}) => {
  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'chat', label: 'Live Firewall', icon: <Shield className="w-4 h-4" /> },
    { id: 'comparison', label: 'Raw vs Protected', icon: <SplitSquareVertical className="w-4 h-4" />, badge: 'Demo' },
    { id: 'simulator', label: 'Research Simulator', icon: <Activity className="w-4 h-4" /> },
    { id: 'evaluations', label: 'Benchmark Lab', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'trace', label: 'Firewall Trace', icon: <Sliders className="w-4 h-4" /> },
    { id: 'about', label: 'Research Paper', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('chat')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-indigo-950/50">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-wider text-white">SYCOGUARD</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800/80 text-cyan-400">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Sycophancy &amp; Hallucination Firewall
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Status Indicators & Firewall Toggle */}
        <div className="flex items-center space-x-3">
          {/* Multi-Provider Selector / Badge */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedProvider}
              onChange={(e) => onSelectProvider?.(e.target.value as any)}
              className="bg-transparent text-slate-300 font-mono text-[11px] focus:outline-none cursor-pointer"
              title="Select LLM Provider (Triple-LLM Engine: Gemini, OpenRouter & ChatGPT)"
            >
              <option value="auto" className="bg-slate-900 text-slate-200">
                {activeProvider ? `AUTO (${activeProvider.toUpperCase()})` : 'AUTO (MULTI-LLM)'}
              </option>
              <option value="gemini" className="bg-slate-900 text-slate-200">
                GEMINI-3.6-FLASH
              </option>
              <option value="openrouter" className="bg-slate-900 text-slate-200">
                OPENROUTER (NVIDIA)
              </option>
              <option value="openai" className="bg-slate-900 text-slate-200">
                CHATGPT (GPT-4O)
              </option>
            </select>
          </div>

          {/* Firewall Active Status Button */}
          <button
            onClick={() => setFirewallActive(!firewallActive)}
            title="Toggle In-line Firewall Interception"
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              firewallActive
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400 shadow-sm shadow-emerald-900/30'
                : 'bg-amber-950/60 border-amber-800 text-amber-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${firewallActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{firewallActive ? 'Firewall Active' : 'Bypass Mode'}</span>
          </button>
        </div>

      </div>

      {/* Mobile nav sub-bar */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 space-x-2 border-t border-slate-900 bg-slate-950">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap px-3 py-1 rounded-md text-xs font-medium flex items-center space-x-1.5 ${
              activeTab === item.id
                ? 'bg-slate-800 text-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
