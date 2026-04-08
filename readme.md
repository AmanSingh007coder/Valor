Valor: Autonomous Supply Chain Risk Management and Orchestration
Valor is a multi-agent AI system designed to monitor, analyze, and respond to supply chain risks in real time. Instead of only detecting issues, Valor enables autonomous decision making by coordinating multiple specialized agents through the Model Context Protocol (MCP).

System Overview
Valor models a supply chain as a dynamic network of suppliers connected to a company. Each supplier has a continuously updated state (active, risky, or blocked), and the system reacts to changes by evaluating risk and taking appropriate actions such as rerouting or reducing dependency.
Unlike traditional systems that only provide alerts, Valor performs a full decision loop:Detect → Verify → Decide → Act → Update

Core Architecture
* Intelligence Layer: Google Gemini 1.5 Flash (used for reasoning and explanation)
* Protocol Layer: Model Context Protocol (MCP) for shared context and tool interaction
* Orchestration Layer: LangGraph.js for multi-agent workflow execution
* Data Layer: Structured simulation (JSON-based supply chain state)

MCP-Based Coordination (Key Concept)
Agents in Valor do not directly call each other.
Instead:
* Each agent writes its findings to a shared MCP context
* Other agents read from this shared context and react accordingly
This enables asynchronous, coordinated decision-making across multiple agents.

Agent Roles and Responsibilities
Agent	Responsibility
Sourcing Agent	Manages suppliers and finds alternatives when disruptions occur
Finance Agent	Detects pricing anomalies and evaluates cost impact
News Agent	Identifies external signals such as disruptions or events
Compliance Agent	Verifies whether issues violate ethical or regulatory standards
Audit Agent	Aggregates inputs, resolves conflicts, and makes final decisions
Decision Framework
The Audit Agent combines inputs from all agents and evaluates risk using a rule-based weighted system.
Instead of acting immediately, the system evaluates multiple possible actions and selects the most appropriate one based on the defined objective.

Autonomous Mitigation Strategy
Valor supports progressive decision making instead of abrupt actions:
1. Monitor (Low Risk) Continue observation without disruption
2. Mitigate (Medium Risk) Reduce dependency and prepare alternatives
3. Replace / Block (High Risk) Reroute supply and remove supplier from network

Advanced Decision Intelligence (Key Differentiator)
Valor extends beyond traditional systems with the following capabilities:
1. What-if Simulation
Before executing an action, the system evaluates multiple strategies (e.g., immediate block vs gradual shift) and selects the optimal one.

2. Agent Conflict Resolution
Different agents may produce conflicting recommendations (e.g., Finance vs Compliance).The system detects these conflicts and resolves them using predefined priority rules.

3. Decision Explainability
Every decision is accompanied by a clear explanation based on agent inputs and reasoning.

4. Risk Evolution Timeline
The system tracks how supplier risk changes over time, providing historical context for decisions.

5. Learning from Past Decisions
Previous actions and their outcomes are stored and used to improve future decision-making.

Visualization (User Interface)
Valor provides a real-time visual representation of the supply chain:
* Network Graph: Suppliers shown as nodes with dynamic states (green, yellow, red)
* Action Log: Step-by-step explanation of agent decisions
* Metrics Panel:Displays cost, delay, and risk impact after each action

Installation and Deployment
Prerequisites
* Node.js v18+
* TypeScript 5+
* Google AI Studio API Key

Backend Setup
cd backend
npm install
Create .env file:
GEMINI_API_KEY=your_key_here
Run:
npm run build
npm start

Frontend Setup
cd frontend
npm install
npm run dev

Operational Workflow
The system runs three main components:
1. API Layer :serves system state and logs
2. Orchestration Engine :executes multi-agent workflows
3. Frontend Dashboard :visualizes network and decisions

Future Improvements
* Predictive risk modeling using historical patterns
* Expansion to multi-tier supplier networks
* Enhanced decision optimization strategies

Summary
Valor is not just a monitoring system it is an autonomous decision making platform. By combining multi-agent coordination, shared context via MCP, and intelligent decision strategies, it provides a more adaptive and explainable approach to supply chain management.
