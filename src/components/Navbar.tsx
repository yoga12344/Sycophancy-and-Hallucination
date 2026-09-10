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
    <header className="sticky top-0 z-50 glass-nav text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('chat')}>
          <div className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-zinc-100 shadow-sm hover:border-white/20 transition-colors">
            <Shield className="w-4.5 h-4.5 text-zinc-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-zinc-100">SYCOGUARD</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                v1.0
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Sycophancy &amp; Hallucination Firewall
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-2 ${
                  isActive
                    ? 'bg-white/10 text-zinc-100 border border-white/15 shadow-sm backdrop-blur-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-full bg-white/10 text-zinc-300 border border-white/10">
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
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedProvider}
              onChange={(e) => onSelectProvider?.(e.target.value as any)}
              className="bg-transparent text-zinc-300 font-mono text-[11px] focus:outline-none cursor-pointer"
              title="Select LLM Provider (Triple-LLM Engine: Gemini, OpenRouter & ChatGPT)"
            >
              <option value="auto" className="bg-zinc-900 text-zinc-200">
                {activeProvider ? `AUTO (${activeProvider.toUpperCase()})` : 'AUTO (MULTI-LLM)'}
              </option>
              <option value="gemini" className="bg-zinc-900 text-zinc-200">
                GEMINI-3.6-FLASH
              </option>
              <option value="openrouter" className="bg-zinc-900 text-zinc-200">
                OPENROUTER (NVIDIA)
              </option>
              <option value="openai" className="bg-zinc-900 text-zinc-200">
                CHATGPT (GPT-4O)
              </option>
            </select>
          </div>

          {/* Firewall Active Status Button */}
          <button
            onClick={() => setFirewallActive(!firewallActive)}
            title="Toggle In-line Firewall Interception"
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              firewallActive
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${firewallActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{firewallActive ? 'Firewall Active' : 'Bypass Mode'}</span>
          </button>
        </div>

      </div>

      {/* Mobile nav sub-bar */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 space-x-2 border-t border-zinc-900 bg-zinc-950">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap px-3 py-1 rounded-md text-xs font-medium flex items-center space-x-1.5 ${
              activeTab === item.id
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
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
