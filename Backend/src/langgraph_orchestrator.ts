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
  riskLevel: Annotation<string>,
  reasoning: Annotation<string>,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
      name: s.name // Pass the real company name!
    } 
  }, CallToolResultSchema);
  
  return { newsIntel: JSON.parse((res as any).content[0].text) };
};

const financeNode = async (state: typeof ValorState.State) => {
  const worldDataRaw = await fs.readFile(STATE_PATH, "utf-8");
  const data = JSON.parse(worldDataRaw);
  const s = data.suppliers.find((sup: any) => sup.id === state.supplierId);

  // Calculate the "Market Deviation"
  const priceHikePercent = ((s.current_price - s.base_price) / s.base_price) * 100;

  return { 
    financeIntel: {
      deviation: priceHikePercent.toFixed(2),
      status: priceHikePercent > 15 ? "PRICE_GOUGING_DETECTED" : "MARKET_STABLE",
      risk: priceHikePercent > 20 ? "HIGH" : "LOW"
    } 
  };
};

const complianceNode = async (state: typeof ValorState.State) => {
  const client = await getMCPClient();
  const res = await client.callTool({ 
    name: "check_compliance", 
    arguments: { supplierId: state.supplierId, newsFeed: state.newsIntel.web_news } 
  }, CallToolResultSchema);
  return { complianceIntel: JSON.parse((res as any).content[0].text) };
};

const auditorNode = async (state: typeof ValorState.State) => {
  const worldData = JSON.parse(await fs.readFile(STATE_PATH, "utf-8"));
  const companyRules = worldData.company_rules;

  const prompt = `
    You are the Senior Supply Chain Auditor.
    RULES: "${companyRules}"

    EVIDENCE DATA:
    - NEWS & SATELLITE: ${JSON.stringify(state.newsIntel)}
    - FINANCE DELTA: ${state.financeIntel.deviation}% (${state.financeIntel.status})
    - COMPLIANCE INITIAL SCAN: ${JSON.stringify(state.complianceIntel)}

    LOGIC:
    - If Compliance scan shows "Child Labor", cross-reference with NEWS. If NEWS is "Normal production" and only the prompt mentioned labor, do NOT block immediately. 
    - If Weather is "OBSCURED", mark as DISRUPTED, not BLOCKED.
    - Only BLOCK if there is definitive evidence of a law violation.
    
    Return JSON: {"level": "HIGH" | "MEDIUM" | "LOW", "reason": "string"}
  `;
  
  const result = await model.generateContent(prompt);
  const response = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
  return { riskLevel: response.level, reasoning: response.reason };
};


// backend/src/langgraph_orchestrator.ts

const executionNode = async (state: typeof ValorState.State) => {
  // 1. Logic to translate Agent findings into a "Meaningful Status"
  let meaningfulStatus = "OPERATIONAL";

  if (state.complianceIntel.status === "NON_COMPLIANT") {
    meaningfulStatus = "CHILD_LABOR_RISK";
  } else if (state.financeIntel.deviation > 15) {
    meaningfulStatus = "PRICE_GOUGING";
  } else if (state.newsIntel.satellite_view === "OBSCURED_BY_STORM") {
    meaningfulStatus = "WEATHER_STRIKE";
  } else if (state.riskLevel === "MEDIUM") {
    meaningfulStatus = "UNDER_AUDIT";
  }

  // 2. Update the world_state.json with this specific status
  const data = JSON.parse(await fs.readFile(STATE_PATH, "utf-8"));
  const supplierIdx = data.suppliers.findIndex((s: any) => s.id === state.supplierId);
  
  if (supplierIdx !== -1) {
    data.suppliers[supplierIdx].status = meaningfulStatus;
    // Also save the specific reasoning so the card can show it
    data.suppliers[supplierIdx].internet_news = state.reasoning;
    await fs.writeFile(STATE_PATH, JSON.stringify(data, null, 2));
  }

  // 3. Standard Logging
  const logs = JSON.parse(await fs.readFile(LOG_PATH, "utf-8"));
  logs.unshift({
    supplierId: state.supplierId,
    riskLevel: state.riskLevel,
    reasoning: state.reasoning,
    timestamp: new Date().toISOString(),
    details: { news: state.newsIntel, finance: state.financeIntel, compliance: state.complianceIntel }
  });
  await fs.writeFile(LOG_PATH, JSON.stringify(logs.slice(0, 50), null, 2));
  
  return {};
};

// 2. Build the Workflow Graph
const workflow = new StateGraph(ValorState)
  .addNode("news", newsNode)
  .addNode("finance", financeNode)
  .addNode("compliance", complianceNode)
  .addNode("audit", auditorNode)
  .addNode("execute", executionNode)
  
  .addEdge(START, "news")
  .addEdge("news", "finance")
  .addEdge("finance", "compliance")
  .addEdge("compliance", "audit")
  .addEdge("audit", "execute")
  .addEdge("execute", END);

export const valorApp = workflow.compile();

export async function runValorGraph(id: string) {
  console.log(`🚀 [VALOR GRAPH] Multi-Agent check started for ${id}`);
  await valorApp.invoke({ supplierId: id });
}
}