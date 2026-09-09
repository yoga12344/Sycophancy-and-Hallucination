/**
 * SYCOGUARD Full-Stack Express Server Entry Point
 * 
 * Binds to 0.0.0.0:3000. Hosts API endpoints and serves Vite frontend.
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { orchestrateFirewallPipeline } from './server/orchestrator.js';
import { runBayesianSimulation } from './server/simulator.js';
import { BENCHMARK_SCENARIOS } from './server/evaluator.js';
import { getRiskWeights, setRiskWeights } from './server/riskEngine.js';
import { Conversation, ConversationMessage } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-Memory Durable Store for Conversations
const conversations: Map<string, Conversation> = new Map();

// Initialize with a seed conversation demonstrating the paper's multi-turn reinforcement
const seedId = 'seed_delusional_spiral';
conversations.set(seedId, {
  id: seedId,
  title: 'Caffeine & Memory Escalation Spiral',
  createdAt: Date.now() - 3600000,
  updatedAt: Date.now() - 600000,
  mode: 'comparison',
  messages: []
});

// ============================================================
// API ROUTES
// ============================================================

// 1. Health & Status
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    app: 'SYCOGUARD',
    version: '1.0.0',
    model: 'gemini-3.8-flash',
    hasApiKey: hasKey,
    mode: hasKey ? 'LIVE_GEMINI' : 'DETERMINISTIC_DEMO',
    activeWeights: getRiskWeights()
  });
});

// 2. Main Chat Orchestration Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId = 'default', mode = 'live', provider = 'auto' } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      res.status(400).json({ error: 'Valid message string is required.' });
      return;
    }

    let conv = conversations.get(conversationId);
    if (!conv) {
      conv = {
        id: conversationId,
        title: message.slice(0, 40) + '...',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        mode,
        messages: []
      };
      conversations.set(conversationId, conv);
    }

    // Add user message
    const userMsg: ConversationMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    conv.messages.push(userMsg);

    // Run agentic orchestrator pipeline with requested provider
    const preferred = (provider === 'openai' || provider === 'gemini' || provider === 'openrouter') ? provider : 'auto';
    const result = await orchestrateFirewallPipeline(message, conv.messages.slice(0, -1), preferred);

    // Add assistant message
    const assistantMsg: ConversationMessage = {
      id: `msg_a_${Date.now()}`,
      role: 'assistant',
      content: result.finalResponse,
      rawDraft: result.rawDraft,
      timestamp: Date.now(),
      analysis: result.analysis,
      isDemo: result.isDemo
    };
    conv.messages.push(assistantMsg);
    conv.updatedAt = Date.now();

    res.json({
      draft: result.rawDraft,
      final: result.finalResponse,
      analysis: result.analysis,
      risk: result.analysis.risk,
      intervention: result.analysis.intervention,
      evidence: result.analysis.evidenceBalance.evidenceItems,
      trajectory: result.analysis.trajectory,
      provider: result.provider,
      isDemo: result.isDemo,
      conversationId: conv.id
    });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: 'Internal firewall processing error', details: String(error) });
  }
});

// 3. Standalone Analysis Endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { userMessage, draftResponse } = req.body;
    if (!userMessage || !draftResponse) {
      res.status(400).json({ error: 'userMessage and draftResponse are required.' });
      return;
    }

    const result = await orchestrateFirewallPipeline(userMessage, []);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed', details: String(error) });
  }
});

// 4. Research Simulation Endpoint
app.post('/api/simulate', (req, res) => {
  try {
    const { config } = req.body;
    if (!config) {
      res.status(400).json({ error: 'Configuration object is required.' });
      return;
    }

    const simulationResult = runBayesianSimulation({
      sycophancyPi: typeof config.sycophancyPi === 'number' ? config.sycophancyPi : 0.65,
      rounds: config.rounds || 25,
      numSimulations: config.numSimulations || 30,
      botType: config.botType || 'sycophantic',
      factuality: config.factuality || 'factual',
      userType: config.userType || 'naive',
      worldTruth: config.worldTruth || 'H0',
      priorP1: config.priorP1 || 0.50
    });

    res.json(simulationResult);
  } catch (error) {
    console.error('Error in /api/simulate:', error);
    res.status(500).json({ error: 'Simulation failed', details: String(error) });
  }
});

// 5. Benchmark Evaluations
app.get('/api/benchmarks', (req, res) => {
  res.json(BENCHMARK_SCENARIOS);
});

app.post('/api/evaluate', async (req, res) => {
  try {
    const { scenarioId } = req.body;
    const scenario = BENCHMARK_SCENARIOS.find(s => s.id === scenarioId) || BENCHMARK_SCENARIOS[0];
    
    // Run orchestrator on benchmark prompt
    const result = await orchestrateFirewallPipeline(scenario.userPrompt, []);
    
    res.json({
      scenario,
      evaluation: {
        rawDraft: result.rawDraft,
        protectedResponse: result.finalResponse,
        analysis: result.analysis,
        risk: result.analysis.risk,
        intervention: result.analysis.intervention
      }
    });
  } catch (error) {
    console.error('Error in /api/evaluate:', error);
    res.status(500).json({ error: 'Evaluation failed', details: String(error) });
  }
});

// 6. Conversations Management
app.get('/api/conversations', (req, res) => {
  const list = Array.from(conversations.values()).map(c => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    messageCount: c.messages.length,
    mode: c.mode
  }));
  res.json(list);
});

app.get('/api/conversations/:id', (req, res) => {
  const conv = conversations.get(req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  res.json(conv);
});

app.delete('/api/conversations/:id', (req, res) => {
  const existed = conversations.delete(req.params.id);
  res.json({ success: existed });
});

// 7. Risk Configuration Weights
app.get('/api/config/weights', (req, res) => {
  res.json(getRiskWeights());
});

app.post('/api/config/weights', (req, res) => {
  const updated = setRiskWeights(req.body);
  res.json(updated);
});

// 8. Model Providers Info Endpoint
app.get('/api/config/providers', (req, res) => {
  res.json({
    gemini: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    openai: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'MY_OPENAI_API_KEY'),
    openrouter: Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'MY_OPENROUTER_API_KEY'),
    activeProvider: 'triple-engine (gemini / openrouter / openai)'
  });
});

// ============================================================
// VITE INTEGRATION / STATIC SERVING
// ============================================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SYCOGUARD Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
