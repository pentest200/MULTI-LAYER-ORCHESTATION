<p align="center">
  <img src="https://img.shields.io/badge/Chakraview-AI%20Agent%20Command%20Center-blue?style=for-the-badge&logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/version-0.8.2-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" />
</p>

<h1 align="center">⚡ Chakraview — AI Agent Command Center</h1>

<p align="center">
  <strong>The control layer for multi-agent AI systems — enabling orchestration, observability, and governance at scale.</strong>
</p>

<p align="center">
  <a href="#-demo">Demo</a> •
  <a href="#-overview">Overview</a> •
  <a href="#-problem">Problem</a> •
  <a href="#-solution">Solution</a> •
  <a href="#-why-this-matters">Why This Matters</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-features">Features</a> •
  <a href="#-business-model">Business Model</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-setup">Setup</a>
</p>

---

## 🎥 Demo

* 🔗 Live App: <https://multi-layer-orchestation.vercel.app/>
* 🎬 Demo Video: <your-video-link>

> ⚡ 60-second walkthrough of the system.

---

## 🚀 Overview

**Chakraview** is a **multi-layer AI orchestration platform** that enables teams to launch, monitor, and control multiple AI agents executing tasks in parallel — with built-in **human oversight, cost control, and system safety**.

It acts as a **control plane for agentic systems**, solving the growing complexity of managing autonomous AI workflows in production environments.

---

## ❗ Problem

AI systems are evolving from single prompts to **multi-agent workflows**, but current tooling is not designed for this shift.

Key challenges:

* No centralized control over multiple agents
* Workflows are fragile and hard to debug
* No auditability or reasoning visibility
* Lack of human-in-the-loop safety
* Poor cost and resource tracking

👉 Result:

* Unreliable automation
* High operational risk
* Limited enterprise adoption

---

## 💡 Solution

**Chakraview — AI Agent Command Center**

A platform that provides:

### 1. Orchestration Layer

* Task → Planner → DAG-based execution
* Parallel agent execution with queue-based processing

### 2. Control Layer

* Human approval for sensitive actions
* Role-based access (Owner, Admin, Operator, Viewer)
* Workspace-level isolation (multi-tenancy)

### 3. Observability Layer

* Real-time task monitoring
* Full decision logs (thought, action, tool usage)
* Replay system for debugging and iteration

---

## ⏱️ Why This Matters

* AI agents are becoming core to business workflows
* Enterprises require **control, compliance, and visibility**
* Existing tools focus on building agents — not managing them

👉 Chakraview focuses on the missing layer:
**Control + Governance for AI systems**

---

## 🧠 Architecture

### Execution Flow

User Input → Planner → Task Graph (DAG) → Queue → Workers → Agents → Output

### System Components

* **Planner Engine** → Converts tasks into execution graphs
* **Queue System** → Handles scalable task distribution (Redis/Kafka)
* **Worker Nodes** → Execute agent tasks
* **Memory Layer**

  * Short-term → Redis
  * Long-term → Vector DB
* **Control System**

  * Approval system
  * Guardrails
  * Budget enforcement

---

## ✨ Features

### Core System

* Multi-agent orchestration with parallel execution
* Visual workflow system (DAG-based pipelines)
* Real-time execution tracking

### System Controls

* Human-in-the-loop approvals
* Task and node state management
* Planner versioning for reproducibility

### Intelligence & Safety

* Structured reasoning logs (thought, action, reason)
* Tool guardrails and validation
* Automatic replanning on failure

### Platform

* Multi-tenancy with workspace isolation
* RBAC (Owner, Admin, Operator, Viewer)
* Token usage tracking and cost control

---

## 💰 Business Model

Chakraview is designed as a **platform for AI operations**:

### Pricing Strategy

* Usage-based pricing (tasks / tokens / workflows)
* Team-based subscriptions
* Enterprise plans (security, audit logs, SLAs)

### Target Users

* AI-first startups
* Internal automation teams
* Enterprises deploying agent workflows

---

## 🏗️ Tech Stack

| Layer    | Technology                       |
| -------- | -------------------------------- |
| Frontend | Next.js 14, React 18             |
| Backend  | Node.js + Fastify                |
| Database | SQLite (dev) / PostgreSQL (prod) |
| AI       | OpenAI API                       |
| Realtime | WebSockets                       |
| Queue    | Redis / Kafka                    |
| Memory   | Redis + Vector DB                |

---

## ⚙️ Setup

### Prerequisites

* Node.js ≥ 18
* npm ≥ 9
* OpenAI API key

### Run Locally

```bash id="run01"
git clone https://github.com/kartikeya2006jay/multi-layer_orchestation.git
cd multi-layer_orchestation
npm run install:all
npm run dev
```

### Environment

<!-- **backend/.env**

```env id="env01"
PORT=3001
JWT_SECRET=your_secret
OPENAI_API_KEY=your_key
```

**frontend/.env**

```env id="env02"
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

--- -->

## ▶️ Usage

1. Create account and workspace
2. Configure API key
3. Launch agents and tasks
4. Monitor execution in dashboard
5. Approve/reject critical outputs

---

## 🌐 Deployment

* Frontend → Vercel
* Backend → Railway 

---

## 📄 License

MIT License

---

<p align="center">
  <strong>Built with ⚡ by the Chakraview team</strong>
</p>