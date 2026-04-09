import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";

dotenv.config();

const STATE_PATH = path.join(process.cwd(), "src", "data", "world_state.json");
const LOG_PATH = path.join(process.cwd(), "src", "data", "logs.json");

// 1. Define the Shared Memory (State)
const ValorState = Annotation.Root({
  supplierId: Annotation<string>,
  newsIntel: Annotation<any>,
  financeIntel: Annotation<any>,
  complianceIntel: Annotation<any>,
  votes: Annotation<any[]>,       //Store agent votes
  simulations: Annotation<any[]>, //Store what-if scenarios
  riskLevel: Annotation<string>,
  reasoning: Annotation<string>,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const getMCPClient = async () => {
  const transport = new StdioClientTransport({
    command: "node",
    args: [path.join(process.cwd(), "dist", "index.js")],
  });
  const client = new Client({ name: "Valor-Orchestrator", version: "1.0.0" }, {});
  await client.connect(transport);
  return client;
};

// --- SPECIALIST NODES ---

const newsNode = async (state: typeof ValorState.State) => {
  const worldDataRaw = await fs.readFile(STATE_PATH, "utf-8");
  const data = JSON.parse(worldDataRaw);
  const s = data.suppliers.find((sup: any) => sup.id === state.supplierId);

  const client = await getMCPClient();
  const res = await client.callTool({ 
    name: "get_triangulated_intel", 
    arguments: { 
      supplierId: state.supplierId,
      lat: s.lat,
      lng: s.lng,
      name: s.name 
    } 
  }, CallToolResultSchema);
  
  const intel = JSON.parse((res as any).content[0].text);
  
  
  const vote = intel.web_news.toLowerCase().includes("critical") || intel.web_news.toLowerCase().includes("illegal") ? "BLOCK" : "KEEP";
  
  return { 
    newsIntel: intel,
    votes: [...(state.votes || []), { agent: "News", vote, weight: 1 }]
  };
};

const financeNode = async (state: typeof ValorState.State) => {
  const worldDataRaw = await fs.readFile(STATE_PATH, "utf-8");
  const data = JSON.parse(worldDataRaw);
  const s = data.suppliers.find((sup: any) => sup.id === state.supplierId);

  const priceHikePercent = ((s.current_price - s.base_price) / s.base_price) * 100;
  
  
  const vote = priceHikePercent > 15 ? "SHIFT" : "KEEP";

  return { 
    financeIntel: {
      deviation: priceHikePercent.toFixed(2),
      status: priceHikePercent > 15 ? "PRICE_GOUGING_DETECTED" : "MARKET_STABLE",
      risk: priceHikePercent > 20 ? "HIGH" : "LOW"
    },
    votes: [...(state.votes || []), { agent: "Finance", vote, weight: 2 }]
  };
};

const complianceNode = async (state: typeof ValorState.State) => {
  const client = await getMCPClient();
  const res = await client.callTool({ 
    name: "check_compliance", 
    arguments: { supplierId: state.supplierId, newsFeed: state.newsIntel.web_news } 
  }, CallToolResultSchema);
  
  const intel = JSON.parse((res as any).content[0].text);
  
  
  const vote = intel.status === "NON_COMPLIANT" ? "BLOCK" : "KEEP";

  return { 
    complianceIntel: intel,
    votes: [...(state.votes || []), { agent: "Compliance", vote, weight: 5 }] // Ethical weight is highest
  };
};

const auditorNode = async (state: typeof ValorState.State) => {
  const worldData = JSON.parse(await fs.readFile(STATE_PATH, "utf-8"));
  const companyRules = worldData.company_rules;

  const prompt = `
    You are the Senior Supply Chain Auditor.
    RULES: "${companyRules}"

    AGENT VOTES: ${JSON.stringify(state.votes)}
    
    EVIDENCE DATA:
    - NEWS & SATELLITE: ${JSON.stringify(state.newsIntel)}
    - FINANCE DELTA: ${state.financeIntel.deviation}%
    - COMPLIANCE INITIAL SCAN: ${JSON.stringify(state.complianceIntel)}

    TASK: Resolve agent votes and finalize decision.
    Return ONLY JSON: {"level": "HIGH" | "MEDIUM" | "LOW", "reason": "string"}
  `;
  
  const result = await model.generateContent(prompt);
  const response = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
  return { riskLevel: response.level, reasoning: response.reason };
};

//Counterfactual Simulation Node
const simulationNode = async (state: typeof ValorState.State) => {
  const prompt = `Perform a Counterfactual Analysis for ${state.supplierId} based on:
    - Current Risk: ${state.riskLevel}
    - Reasoning: ${state.reasoning}

    Simulate exactly 3 scenarios:
    1. ACTION: BLOCK (Immediate cutoff) -> Calculate Estimated Cost Increase % and Risk Reduction.
    2. ACTION: SHIFT (Gradual 30-day move) -> Calculate Transition Delay and Medium Risk.
    3. ACTION: KEEP (Ignore alert) -> Calculate Potential Legal Penalty Cost and High Risk.

    Return ONLY JSON: [{"action": "string", "cost": "string", "risk": "string", "outcome": "string"}]`;

  const result = await model.generateContent(prompt);
  const simulations = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
  return { simulations };
};

const executionNode = async (state: typeof ValorState.State) => {
  //Translate findings into a Meaningful Status for the UI
  let meaningfulStatus = "OPERATIONAL";
  if (state.complianceIntel.status === "NON_COMPLIANT") meaningfulStatus = "CHILD_LABOR_RISK";
  else if (parseFloat(state.financeIntel.deviation) > 15) meaningfulStatus = "PRICE_GOUGING";
  else if (state.newsIntel.satellite_view === "OBSCURED_BY_STORM") meaningfulStatus = "WEATHER_STRIKE";
  else if (state.riskLevel === "MEDIUM") meaningfulStatus = "UNDER_AUDIT";

  //Update world_state.json
  const data = JSON.parse(await fs.readFile(STATE_PATH, "utf-8"));
  const supplierIdx = data.suppliers.findIndex((s: any) => s.id === state.supplierId);
  
  if (supplierIdx !== -1) {
    data.suppliers[supplierIdx].status = meaningfulStatus;
    data.suppliers[supplierIdx].internet_news = state.reasoning;
    await fs.writeFile(STATE_PATH, JSON.stringify(data, null, 2));
  }

  //Save Detailed Logs for the "Truth Engine" horizontal ticker
  const logs = JSON.parse(await fs.readFile(LOG_PATH, "utf-8"));
  logs.unshift({
    supplierId: state.supplierId,
    riskLevel: state.riskLevel,
    reasoning: state.reasoning,
    timestamp: new Date().toISOString(),
    votes: state.votes,           // Feature 2 Data
    simulations: state.simulations, // Feature 1 Data
    details: { 
        news: state.newsIntel, 
        finance: state.financeIntel, 
        compliance: state.complianceIntel 
    }
  });
  await fs.writeFile(LOG_PATH, JSON.stringify(logs.slice(0, 50), null, 2));
  
  return {};
};

//Build the Workflow Graph
const workflow = new StateGraph(ValorState)
  .addNode("news", newsNode)
  .addNode("finance", financeNode)
  .addNode("compliance", complianceNode)
  .addNode("audit", auditorNode)
  .addNode("simulate", simulationNode)
  .addNode("execute", executionNode)
  
  .addEdge(START, "news")
  .addEdge("news", "finance")
  .addEdge("finance", "compliance")
  .addEdge("compliance", "audit")
  .addEdge("audit", "simulate")
  .addEdge("simulate", "execute")
  .addEdge("execute", END);

export const valorApp = workflow.compile();

export async function runValorGraph(id: string) {
  console.log(`🚀 [VALOR GRAPH] Multi-Agent Strategic Audit started for ${id}`);
  await valorApp.invoke({ supplierId: id });
}