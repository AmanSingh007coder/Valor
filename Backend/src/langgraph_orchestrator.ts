import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";
import { ComplianceRulesEngine } from "./compliance";
import type { ValorGraphState, WorldState } from "./types";

dotenv.config();

const STATE_PATH = path.join(process.cwd(), "src", "data", "world_state.json");
const LOG_PATH = path.join(process.cwd(), "src", "data", "logs.json");

const ValorState = Annotation.Root({
  supplierId: Annotation<string>,
  newsIntel: Annotation<any>,
  financeIntel: Annotation<any>,
  complianceIntel: Annotation<any>,
  votes: Annotation<any[]>,       
  simulations: Annotation<any[]>, 
  riskLevel: Annotation<string>,
  reasoning: Annotation<string>,
  complianceScore: Annotation<number>,
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

// --- NODES ---

const newsNode = async (state: typeof ValorState.State) => {
  const data = JSON.parse(await fs.readFile(STATE_PATH, "utf-8"));
  const s = data.suppliers.find((sup: any) => sup.id === state.supplierId);
  const client = await getMCPClient();
  const res = await client.callTool({ 
    name: "get_triangulated_intel", 
    arguments: { supplierId: state.supplierId, lat: s.lat, lng: s.lng, name: s.name } 
  }, CallToolResultSchema);
  
  const intel = JSON.parse((res as any).content[0].text);
  const vote = intel.web_news.toLowerCase().includes("critical") || intel.web_news.toLowerCase().includes("illegal") ? "BLOCK" : "KEEP";
  return { newsIntel: intel, votes: [...(state.votes || []), { agent: "News", vote, weight: 1 }] };
};

const financeNode = async (state: typeof ValorState.State) => {
  const data = JSON.parse(await fs.readFile(STATE_PATH, "utf-8"));
  const s = data.suppliers.find((sup: any) => sup.id === state.supplierId);
  const priceHike = ((s.current_price - s.base_price) / s.base_price) * 100;
  const vote = priceHike > 15 ? "SHIFT" : "KEEP";
  return { 
    financeIntel: { deviation: priceHike.toFixed(2), status: priceHike > 15 ? "PRICE_GOUGING" : "STABLE" },
    votes: [...(state.votes || []), { agent: "Finance", vote, weight: 2 }]
  };
};

const complianceNode = async (state: typeof ValorState.State) => {
  const data: WorldState = JSON.parse(await fs.readFile(STATE_PATH, "utf-8"));
  const s = data.suppliers.find((sup: any) => sup.id === state.supplierId);

  if (!s) {
    return {
      complianceIntel: { isCompliant: true, violations: [], score: 100 },
      complianceScore: 100,
      votes: [...(state.votes || []), { agent: "Compliance", vote: "KEEP", weight: 5 }],
    };
  }

  // Use the compliance rules engine
  const engine = new ComplianceRulesEngine(data.compliance_rules);
  const compliance = engine.checkCompliance(s, state.newsIntel?.web_news || "");

  const vote = compliance.score < 60 ? "BLOCK" : "KEEP";
  return {
    complianceIntel: compliance,
    complianceScore: compliance.score,
    votes: [...(state.votes || []), { agent: "Compliance", vote, weight: 5 }],
  };
};

const auditorNode = async (state: typeof ValorState.State) => {
  const prompt = `Resolve agent votes: ${JSON.stringify(state.votes)}. Return ONLY JSON: {"level": "HIGH"|"LOW", "reason": "string"}`;
  const result = await model.generateContent(prompt);
  const response = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
  return { riskLevel: response.level, reasoning: response.reason };
};

const simulationNode = async (state: typeof ValorState.State) => {
  const prompt = `Simulate 3 scenarios for ${state.supplierId} (BLOCK, SHIFT, KEEP). Return JSON array.`;
  const result = await model.generateContent(prompt);
  const simulations = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
  return { simulations };
};

const executionNode = async (state: typeof ValorState.State) => {
  const data: WorldState = JSON.parse(await fs.readFile(STATE_PATH, "utf-8"));
  const idx = data.suppliers.findIndex((s: any) => s.id === state.supplierId);
  const supplier = data.suppliers[idx];

  // Determine supplier status based on compliance and finance data
  let status = "OPERATIONAL";
  let statusDetail = "";

  if (state.complianceScore! < 30) {
    status = "COMPLIANCE_VIOLATION";
    statusDetail = "Critical compliance violations detected";
  } else if (state.complianceScore! < 60) {
    status = "CHILD_LABOR_RISK";
    statusDetail = "Compliance score below acceptable threshold";
  } else if (parseFloat(state.financeIntel?.deviation || 0) > 20) {
    status = "PRICE_GOUGING";
    statusDetail = `Price increased by ${state.financeIntel.deviation}%`;
  } else if (supplier.satellite_view?.includes("OBSCURED")) {
    status = "WEATHER_RISK";
    statusDetail = "Severe weather at supplier location";
  }

  // Update supplier status
  supplier.status = status as any;
  supplier.status_detail = statusDetail;
  supplier.compliance_score = state.complianceScore;
  supplier.risk_level = state.complianceScore! < 30 ? "HIGH" : state.complianceScore! < 60 ? "MEDIUM" : "LOW";
  supplier.internet_news = state.reasoning;

  // HIERARCHY REROUTING LOGIC
  if (status !== "OPERATIONAL" && data.active_node === state.supplierId) {
    console.log(
      `⚠️ DISRUPTION DETECTED [${supplier.name}]. Evaluating hierarchy routing...`
    );

    const engine = new ComplianceRulesEngine(data.compliance_rules);
    const nextSupplier = engine.getNextInHierarchy(
      state.supplierId,
      data.hierarchy.primary,
      data.hierarchy.secondary,
      data.hierarchy.tertiary
    );

    if (nextSupplier) {
      const oldActive = data.active_node;
      const nextSupplierObj = data.suppliers.find((s: any) => s.id === nextSupplier);

      data.active_node = nextSupplier;
      data.current_path = data.current_path || [];
      data.current_path.push(nextSupplier);

      // Record disruption event
      if (!data.disruption_history) data.disruption_history = [];
      data.disruption_history.push({
        timestamp: new Date().toISOString(),
        supplierId: state.supplierId,
        supplierName: supplier.name,
        reason: statusDetail || state.reasoning,
        previousActive: oldActive,
        newActive: nextSupplier,
        riskLevel: supplier.risk_level || "HIGH",
      });

      console.log(
        `✓ REROUTING: Primary [${supplier.name}] → Backup [${nextSupplierObj?.name}]`
      );
    } else {
      console.log("⚠️ No backup suppliers available!");
    }
  }

  await fs.writeFile(STATE_PATH, JSON.stringify(data, null, 2));

  const logs = JSON.parse(await fs.readFile(LOG_PATH, "utf-8"));
  logs.unshift({
    supplierId: state.supplierId,
    supplierName: supplier.name,
    riskLevel: state.riskLevel,
    complianceScore: state.complianceScore,
    reasoning: state.reasoning,
    timestamp: new Date().toISOString(),
    votes: state.votes,
    simulations: state.simulations,
    details: {
      news: state.newsIntel,
      finance: state.financeIntel,
      compliance: state.complianceIntel,
    },
  });
  await fs.writeFile(LOG_PATH, JSON.stringify(logs.slice(0, 50), null, 2));
  return {};
};

const workflow = new StateGraph(ValorState)
  .addNode("news", newsNode).addNode("finance", financeNode).addNode("compliance", complianceNode)
  .addNode("audit", auditorNode).addNode("simulate", simulationNode).addNode("execute", executionNode)
  .addEdge(START, "news").addEdge("news", "finance").addEdge("finance", "compliance")
  .addEdge("compliance", "audit").addEdge("audit", "simulate").addEdge("simulate", "execute").addEdge("execute", END);

export const valorApp = workflow.compile();

export async function runValorGraph(id: string, worldState?: WorldState) {
  try {
    // Get fresh state if not provided
    if (!worldState) {
      const stateData = await fs.readFile(STATE_PATH, "utf-8");
      worldState = JSON.parse(stateData) as WorldState;
    }

    const supplier = worldState!.suppliers.find((s: any) => s.id === id);
    if (!supplier) {
      console.error(`Supplier ${id} not found`);
      return;
    }

    console.log(`[LangGraph] Starting orchestration for ${supplier.name}...`);
    await valorApp.invoke({ supplierId: id });
    console.log(`[LangGraph] Orchestration complete for ${supplier.name}`);
  } catch (err) {
    console.error(`[LangGraph] Error during orchestration:`, err);
  }
}