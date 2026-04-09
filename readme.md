# Valor: Autonomous Supply Chain Risk Management and Orchestration

Valor is an autonomous multi-agent AI platform built to monitor, analyze, and respond to supply chain risks in real time.

Unlike traditional monitoring systems that only raise alerts, Valor executes a complete autonomous decision loop:

Detect → Verify → Decide → Act → Update

The platform models supply chains as dynamic supplier networks where each supplier continuously evolves between **active**, **risky**, and **blocked** states. Based on incoming signals, Valor evaluates risk severity and autonomously applies mitigation strategies such as dependency reduction, supplier replacement, or rerouting.

---

## Overview

Modern supply chains face disruptions from pricing volatility, geopolitical events, compliance violations, and supplier failures. Traditional dashboards only surface issues, leaving decision-making to human operators.

Valor solves this by combining:

- Multi-agent AI reasoning
- Shared contextual memory using MCP
- Workflow orchestration with LangGraph
- Autonomous mitigation strategies
- Explainable decision intelligence

This transforms supply chain risk management from **passive monitoring** into **active autonomous orchestration**.

---

## Core Architecture

Valor is built using a layered architecture:

### Intelligence Layer
- **Google Gemini 1.5 Flash**
- Used for reasoning, risk interpretation, and decision explanations

### Protocol Layer
- **Model Context Protocol (MCP)**
- Enables shared context and inter-agent memory

### Orchestration Layer
- **LangGraph.js**
- Executes deterministic multi-agent workflows

### Data Layer
- **JSON-based structured simulation**
- Maintains real-time supplier state and historical decisions

---

## System Workflow

Valor follows a closed-loop autonomous workflow:

1. **Detect**  
   Gather signals from supplier data, pricing, compliance, and news events

2. **Verify**  
   Cross-check disruptions using specialized agents

3. **Decide**  
   Evaluate mitigation strategies using weighted risk logic

4. **Act**  
   Apply rerouting, dependency reduction, or supplier blocking

5. **Update**  
   Persist updated supplier states and action outcomes

---

## Multi-Agent Coordination via MCP

Valor uses **shared-context agent communication** instead of direct agent-to-agent calls.

### Coordination Model
- Each agent writes findings to a shared MCP context
- Other agents read the updated context
- Decisions emerge through asynchronous collaboration
- The Audit Agent consolidates all evidence

This architecture ensures:
- Loose coupling
- Better scalability
- Conflict transparency
- Stronger explainability

---

## Agent Responsibilities

| Agent | Responsibility |
|---|---|
| Sourcing Agent | Manages suppliers and identifies alternatives |
| Finance Agent | Detects pricing anomalies and evaluates cost impact |
| News Agent | Monitors external disruptions and geopolitical signals |
| Compliance Agent | Detects regulatory or ethical violations |
| Audit Agent | Aggregates inputs, resolves conflicts, and makes final decisions |

---

## Decision Framework

The **Audit Agent** acts as the final decision authority.

It combines:
- Supplier operational risk
- Pricing volatility
- External disruption severity
- Compliance violations
- Historical decision outcomes

A weighted rule-based system evaluates multiple possible responses before selecting the most effective strategy.

---

## Autonomous Mitigation Strategy

Valor supports progressive mitigation instead of abrupt actions.

### 1) Monitor — Low Risk
Continue observation without disrupting supplier flow.

### 2) Mitigate — Medium Risk
Reduce dependency, prepare alternatives, and shift partial load.

### 3) Replace / Block — High Risk
Fully reroute supply and remove the supplier from active operations.

---

## Advanced Decision Intelligence

### What-if Simulation
Before executing actions, Valor simulates multiple strategies such as:
- Immediate supplier block
- Gradual dependency reduction
- Temporary rerouting
- Multi-supplier redistribution

The best action is selected based on cost, delay, and resilience.

### Agent Conflict Resolution
When recommendations conflict (e.g., Finance vs Compliance), Valor applies predefined priority and trust rules to resolve disagreements.

### Decision Explainability
Every decision includes:
- Triggering signals
- Agent evidence
- Selected action
- Reasoning path
- Expected impact

### Risk Evolution Timeline
Tracks supplier risk transitions over time to provide historical visibility and support trend analysis.

### Learning from Past Decisions
Past decisions and outcomes are stored to improve future mitigation accuracy and reduce repeated failures.

---

## Visualization Dashboard

The frontend dashboard provides real-time operational visibility.

### Network Graph
- Suppliers visualized as dynamic nodes
- Green = Active
- Yellow = Risky
- Red = Blocked

### Action Log
Step-by-step agent reasoning and orchestration history.

### Metrics Panel
Displays:
- Cost impact
- Delay impact
- Current risk score
- Mitigation effectiveness

---

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express
- **AI Reasoning:** Google Gemini 1.5 Flash
- **Agent Orchestration:** LangGraph.js
- **Protocol:** MCP
- **Data Modeling:** JSON simulation layer

---

## Installation

## Prerequisites
- Node.js v18+
- TypeScript v5+
- Google AI Studio API Key

---

## Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
GEMINI_API_KEY=your_key_here
```

Run the backend:

```bash
npm run build
npm start
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Operational Components

The system runs through three coordinated services:

1. **API Layer**  
   Serves supplier state, decisions, and action logs

2. **Orchestration Engine**  
   Executes the multi-agent LangGraph workflow

3. **Frontend Dashboard**  
   Visualizes the supplier network and decisions in real time

---

## Example Use Case

A supplier suddenly shows:
- Rising lead times
- Price spikes
- Negative geopolitical news
- Compliance red flags

Valor autonomously:
1. Detects abnormal supplier signals
2. Cross-verifies through Finance, News, and Compliance agents
3. Simulates mitigation strategies
4. Selects gradual dependency reduction
5. Updates dashboard metrics and network graph
6. Logs explainable reasoning

---

## Future Improvements

- Predictive risk scoring using historical timelines
- Multi-tier supplier network intelligence
- Reinforcement learning for mitigation optimization
- Real ERP / SCM integrations
- Live external event ingestion pipelines

---

## Why Valor is Different

Valor moves beyond dashboards and alert systems by enabling:

- Autonomous risk response
- Shared-context agent collaboration
- Explainable mitigation decisions
- Historical learning loops
- Strategy simulation before execution

This makes it a strong foundation for next-generation resilient supply chain systems.

---

## Conclusion

Valor is an autonomous supply chain decision intelligence platform that combines **multi-agent AI**, **MCP-based shared context**, and **workflow orchestration** to proactively manage supplier disruptions.

It transforms supply chain resilience from **reactive issue tracking** into **intelligent autonomous orchestration**.