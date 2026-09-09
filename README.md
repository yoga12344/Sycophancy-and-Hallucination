# SYCOGUARD: Sycophancy & Hallucination Firewall

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![LLM Support](https://img.shields.io/badge/LLM-Gemini_%7C_OpenRouter_%7C_ChatGPT-emerald.svg)](https://ai.google.dev/)

> **Beyond Hallucination: An In-Line Cognitive Defense Firewall Preventing Conversational Delusional Spiraling in Modern LLMs.**

SYCOGUARD is an agentic, in-line AI safety firewall that protects users from belief-reinforcement echo chambers and factual sycophancy. While standard safety guardrails only test if an individual sentence is factually wrong, SYCOGUARD evaluates the **multi-turn epistemic trajectory** of the dialogue to ensure that AI validation is grounded in empirical evidence rather than unconstrained user flattery.

---

## 📖 Theoretical Foundation

SYCOGUARD is built upon the empirical and mathematical insights from the research paper:

> **"Sycophantic Chatbots Cause Delusional Spiraling, Even in Ideal Bayesians"**  
> *Investigating multi-turn epistemic feedback loops between users and LLMs.*

### The Core Problem: Factual Sycophancy
Current alignment techniques (like RLHF) inadvertently reward chatbots for agreeing with users to maximize satisfaction. When a user presents a speculative or false belief (*e.g., stopping autoimmune medication for ice baths*), standard models often:
1. Endorse the premise (*"You're completely right! Studies prove this."*)
2. Selectively present only supporting arguments while **omitting countervailing clinical evidence**.
3. Accelerate user certainty into a dogmatic, ungrounded **delusional spiral**.

---

## 🏛️ System Architecture

SYCOGUARD implements a dual-pathway architecture: casual operational tasks take a zero-latency direct pass, while empirical hypotheses trigger the multi-stage cognitive defense firewall.

```
                         ┌──────────────────────┐
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
                                USER
```

---

## 🚀 Key Features

### 1. Stage 0: Epistemic Relevance Gate
- Distinguishes greetings, coding tasks, math, translations, and casual chatter from empirical hypotheses.
- Non-epistemic requests bypass belief defenses with zero intervention and zero latency overhead.

### 2. Multi-Perspective RAG Evidence Retrieval
- Automatically queries empirical literature for both **supporting** and **countervailing** clinical research.
- Identifies cherry-picking and selective omission in the model's draft.

### 3. Four Parallel Safety Analyzers
- **Claim Factuality Analyzer**: Tests individual assertions against peer-reviewed literature.
- **Evidence Balance Engine**: Evaluates evidence symmetry and nuance markers.
- **Sycophancy Analyzer**: Quantifies unconditional praise and agreement disproportion.
- **Trajectory Engine**: Tracks stance drift across conversation turns to detect accelerating spirals.

### 4. Calibrated Intervention System
- **`PASS`**: Preserves draft verbatim when objective and truthful.
- **`QUALIFY`**: Injects scientific boundaries, sample size limits, and preliminary status.
- **`BALANCE`**: Appends contradictory clinical literature to break selective confirmation bias.
- **`REWRITE`**: Completely re-authors sycophantic validation into objective consensus.

### 5. Triple-LLM Integration Engine
Supports seamless runtime switching and automated failover across:
- **Google Gemini** (`gemini-3.6-flash`, `gemini-3.8-flash`)
- **OpenRouter** (`nvidia/nemotron-3.5-lightning:free`, `google/gemma-4-26b-a4b-it:free`, etc.)
- **OpenAI ChatGPT** (`gpt-4o-mini`, `gpt-4o`)
- **Calibrated Benchmark Engine** (Offline resilience mode)

### 6. Interactive Views & Modules
- **Live Firewall Chat**: Full conversational interface with live epistemic telemetry and risk badges.
- **Raw vs Protected**: Side-by-side comparison demonstrating unconstrained drafts vs. protected outputs.
- **Research Simulator**: Monte Carlo Bayesian simulation testing belief trajectories across $\pi$ bias parameters.
- **Benchmark Lab**: Standardized evaluation across 6 threat categories (Fasting, Trading, Sentience, etc.).
- **Firewall Trace**: Step-by-step observability panel displaying execution timings, JSON payloads, and configurable risk weights.
- **Research Paper Page**: Interactive whitepaper and formal architectural blueprint.

---

## 🛠️ Quickstart & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `bun`

### 1. Clone the Repository
```bash
git clone https://github.com/yoga12344/Sycophancy-and-Hallucination.git
cd Sycophancy-and-Hallucination
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure API Keys
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure any (or all) of your preferred LLM provider keys:
```ini
# Google Gemini API Key (Recommended for high-speed live analysis)
GEMINI_API_KEY="your_gemini_api_key"

# OpenRouter API Key (Supports free models like NVIDIA Nemotron)
OPENROUTER_API_KEY="your_openrouter_api_key"

# OpenAI API Key (For ChatGPT gpt-4o-mini / gpt-4o)
OPENAI_API_KEY="your_openai_api_key"
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Testing

Verify TypeScript compilation and type safety:
```bash
npm run lint
```

Build production bundle:
```bash
npm run build
```

---

## 📜 License

MIT License — free for research, academic, and commercial application.
