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
  const client = await getMCPClient();
  const res = await client.callTool({ name: "get_triangulated_intel", arguments: { supplierId: state.supplierId } }, CallToolResultSchema);
  return { newsIntel: JSON.parse((res as any).content[0].text) };
};

const financeNode = async (state: typeof ValorState.State) => {
  const client = await getMCPClient();
  const res = await client.callTool({ name: "get_finance_alerts", arguments: { supplierId: state.supplierId } }, CallToolResultSchema);
  return { financeIntel: JSON.parse((res as any).content[0].text) };
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
  // 1. Fetch the Company Rules from the world_state
  const worldData = JSON.parse(await fs.readFile(STATE_PATH, "utf-8"));
  const companyRules = worldData.company_rules;

  const prompt = `
    You are the Lead Auditor for a company with these SPECIFIC compliance laws:
    "${companyRules}"

    Analyze these reports for ${state.supplierId}:
    - NEWS: ${JSON.stringify(state.newsIntel)}
    - FINANCE: ${JSON.stringify(state.financeIntel)}
    - COMPLIANCE: ${JSON.stringify(state.complianceIntel)}

    Decision Logic:
    1. If the data violates a SPECIFIC COMPANY RULE, take the mandated action.
    2. Return ONLY JSON: {"level": "HIGH" | "MEDIUM" | "LOW", "reason": "string"}
  `;
  
  const result = await model.generateContent(prompt);
  const response = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
  return { riskLevel: response.level, reasoning: response.reason };
};

const executionNode = async (state: typeof ValorState.State) => {
  const client = await getMCPClient();
  await client.callTool({ 
    name: "execute_audit_action", 
    arguments: { riskLevel: state.riskLevel, supplierId: state.supplierId } 
  }, CallToolResultSchema);
  
  // Save Detailed Log for Frontend "Truth Engine"
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